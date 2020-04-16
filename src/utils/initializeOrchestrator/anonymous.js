import {
  getQuestionnaireById,
  getResourceById,
  getDataSurveyUnitById,
  getCommentSurveyUnitById,
} from 'utils/api';
import surveyUnitIdbService from 'utils/indexedbb/services/surveyUnit-idb-service';
import D from 'i18n';

export const initialize = ({
  configuration,
  idQuestionnaire,
  idSurveyUnit,
  setWaitingMessage,
  setQuestionnaire,
  setSurveyUnit,
}) => async () => {
  const { standalone, urlQueenApi } = configuration;
  /**
   * Get questionnaire
   *    standalone mode : get from the API (always online)
   *    embedded mode   : get from the API or service-worker
   */
  setWaitingMessage(D.waitingQuestionnaire);
  const response = await getQuestionnaireById(urlQueenApi, null)(idQuestionnaire);
  const questionnaire = await response.data;
  // set questionnaire to orchestrator
  setQuestionnaire(questionnaire);

  /**
   * Get resources for questionnaire
   * (waiting for spec)
   */
  if (standalone) {
    setWaitingMessage(D.waitingResources);
    await getResourceById(idQuestionnaire);
  }
  /**
   * Get survey-unit's data
   *    standalone mode : get data from API, then from database
   *    embedded mode   : get data from database
   */
  setWaitingMessage(D.waitingDataSU);
  if (standalone) {
    const dataResponse = await getDataSurveyUnitById(urlQueenApi, null)(idSurveyUnit);
    const surveyUnitData = await dataResponse.data;
    const commentResponse = await getCommentSurveyUnitById(urlQueenApi, null)(idSurveyUnit);
    const surveyUnitComment = await commentResponse.data;
    await surveyUnitIdbService.addOrUpdateSU({
      idSU: idSurveyUnit,
      data: surveyUnitData,
      comment: surveyUnitComment,
    });
  }
  const surveyUnit = await surveyUnitIdbService.getByIdSU(idSurveyUnit);
  // set survey unit data to orchestrator
  setSurveyUnit(surveyUnit);
};
