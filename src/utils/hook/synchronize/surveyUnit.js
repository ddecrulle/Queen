import surveyUnitIdbService from 'utils/indexedbb/services/surveyUnit-idb-service';
import { useAPI, useAsyncValue } from 'utils/hook';
import { getPercent } from 'utils';

const useSaveSUToLocalDataBase = () => {
  const { getUeData } = useAPI();

  const refreshGetUeData = useAsyncValue(getUeData);

  const saveSurveyUnit = async surveyUnit => {
    const { id } = surveyUnit; // surveyUnit : {id, questionnaireId}
    const { error, status, data, statusText } = await refreshGetUeData.current(id);
    if (!error) {
      await surveyUnitIdbService.addOrUpdateSU({
        ...surveyUnit,
        ...data,
      });
    } else {
      if ([404, 403, 500].includes(status)) {
        // Do nothing, we retrive this info after
      } else {
        throw new Error(statusText);
      }
    }
  };

  return saveSurveyUnit;
};

export const useSaveSUsToLocalDataBase = updateProgress => {
  const { getSurveyUnits } = useAPI();
  const saveSurveyUnit = useSaveSUToLocalDataBase();

  const refrehGetSurveyUnits = useAsyncValue(getSurveyUnits);

  const putSUS = async campaignId => {
    const { data, error, status, statusText } = await refrehGetSurveyUnits.current(campaignId);

    let i = 0;
    if (!error) {
      await (data || []).reduce(async (previousPromise, surveyUnit) => {
        await previousPromise;
        i += 1;
        updateProgress(getPercent(i, data.length));
        return saveSurveyUnit(surveyUnit);
      }, Promise.resolve());
      updateProgress(100);
    } else {
      if ([404, 403, 500].includes(status)) {
        // save info : pb to access surveyUnit of campaign ${campaignId}
      } else {
        throw new Error(statusText);
      }
    }
  };

  return putSUS;
};

export const useSendSurveyUnits = updateProgress => {
  const { putUeData, putUeDataToTempZone } = useAPI();

  const putDataRef = useAsyncValue(putUeData);
  const putDataTempZoneRef = useAsyncValue(putUeDataToTempZone);
  const send = async () => {
    const surveyUnits = await surveyUnitIdbService.getAll();
    let i = 0;
    updateProgress(0);
    const surveyUnitsInTempZone = [];
    await surveyUnits.reduce(async (previousPromise, surveyUnit) => {
      await previousPromise;
      const { id, ...other } = surveyUnit;
      const sendSurveyUnit = async () => {
        const { error, status } = await putDataRef.current(id, other);
        if (error && status === 403) {
          await putDataTempZoneRef.current(id, other);
          surveyUnitsInTempZone.push(id);
        }
        if (error && ![404, 500].includes(status)) {
          // stop synchro to not lose data (5xx : server is probably KO)
          throw new Error('Server is not responding');
        }
        i += 1;
        updateProgress(getPercent(i, surveyUnits.length));
      };
      return sendSurveyUnit();
    }, Promise.resolve());
    return surveyUnitsInTempZone;
  };

  return send;
};
