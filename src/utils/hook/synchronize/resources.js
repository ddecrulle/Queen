import { useAPI, useAsyncValue } from 'utils/hook';
import { getPercent } from 'utils';

export const usePutResourcesInCache = updateProgress => {
  const { getRequiredNomenclatures, getNomenclature } = useAPI();

  const refreshGetRequiredNomenclatures = useAsyncValue(getRequiredNomenclatures);
  const refreshGetNomenclature = useAsyncValue(getNomenclature);

  const putResourcesInCache = async questionnaireId => {
    const ressourcesFailed = [];
    const { data, error: mainError } = await refreshGetRequiredNomenclatures.current(
      questionnaireId
    );
    if (!mainError) {
      updateProgress(0);
      await (data || []).reduce(async (previousPromise, resourceId) => {
        await previousPromise;
        const putResource = async () => {
          const { error, status, statusText } = await refreshGetNomenclature.current(resourceId);
          if (error) {
            if ([404, 403, 500].includes(status)) {
              ressourcesFailed.push(resourceId);
            } else {
              throw new Error(statusText);
            }
          }
        };

        return putResource();
      }, Promise.resolve());
      updateProgress(100);
      return { success: ressourcesFailed.length === 0, ressourcesFailed };
    } else {
      return { success: false, ressourcesFailed };
    }
  };

  const putAllResourcesInCache = async questionnaireIds => {
    const questionnaireIdsFailed = [];
    let i = 0;
    updateProgress(0);
    await (questionnaireIds || []).reduce(async (previousPromise, questionnaireId) => {
      await previousPromise;
      const putAllResources = async () => {
        const { success } = await putResourcesInCache(questionnaireId);
        if (!success) {
          questionnaireIdsFailed.push(questionnaireId);
        }
      };

      i += 1;
      updateProgress(getPercent(i, questionnaireIds.length));
      return putAllResources();
    }, Promise.resolve());
    return questionnaireIdsFailed;
  };

  return putAllResourcesInCache;
};
