import React, { useRef } from 'react';
import * as lunatic from '@inseefr/lunatic';
import { makeStyles } from '@material-ui/core';
import Card from '@material-ui/core/List';
import Container from '@material-ui/core/Container';
import { useLunaticFetcher } from 'utils/hook';

const useStyles = makeStyles(theme => ({
  root: {
    flex: '1 1 auto',
    backgroundColor: 'whitesmoke',
    padding: '0',
    paddingTop: '1em',
    paddingBottom: '3em',
    marginBottom: '30px',
  },
  component: {
    padding: '10px',
    overflow: 'visible',
    marginBottom: '10px',
    '& *': { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' },
  },
  buttonValidate: {
    justifyContent: 'center',
    marginTop: '10px',
  },
}));

const Orchestrator = ({
  surveyUnit: data,
  standalone,
  readonly,
  savingType,
  preferences,
  pagination,
  missing,
  features,
  source,
  suggesters,
  autoSuggesterLoading,
  filterDescription,
  save,
  close,
}) => {
  const { lunaticFetcher: suggesterFetcher } = useLunaticFetcher();

  const {
    questionnaire,
    components,
    handleChange,
    bindings,
    pagination: { goNext, goPrevious, page, setPage, maxPage, isFirstPage, isLastPage, flow },
  } = lunatic.useLunatic(source, data, {
    savingType,
    preferences,
    features,
    pagination,
    suggesters,
    autoSuggesterLoading,
    suggesterFetcher,
  });
  // const topRef = useRef();

  const classes = useStyles();

  const Button = lunatic.Button;

  const displayComponents = function () {
    const structure = components.reduce((acc, curr) => {
      if (curr.componentType === 'Sequence') {
        acc[curr.id] = [];
        return acc;
      }
      if (curr.componentType === 'Subsequence') {
        acc[curr.id] = [];
        if (curr.hierarchy && curr.hierarchy.sequence && !!acc[curr.hierarchy.sequence.id]) {
          acc[curr.hierarchy.sequence.id].push(curr);
        }
        return acc;
      }
      if (curr.hierarchy && curr.hierarchy.subSequence && !!acc[curr.hierarchy.sequence.id]) {
        acc[curr.hierarchy.subSequence.id].push(curr);
      } else if (curr.hierarchy && curr.hierarchy.sequence && acc[curr.hierarchy.sequence.id]) {
        acc[curr.hierarchy.sequence.id].push(curr);
      }
      return acc;
    }, {});
    return components.map(comp => {
      if (shouldBeDisplayed(structure, comp)) {
        return displayComponent(structure, comp);
      }
      return null;
    });
  };

  const shouldBeDisplayed = function (structure, comp) {
    const { hierarchy } = comp;
    if (!hierarchy) {
      return true;
    }
    if (!hierarchy.sequence) {
      if (
        !hierarchy.subSequence ||
        !structure[hierarchy.subSequence.id] ||
        hierarchy.subSequence.id === comp.id
      ) {
        return true;
      }
      return false;
    }
    if (!structure[hierarchy.sequence.id] || hierarchy.sequence.id === comp.id) {
      return true;
    }
    return false;
  };

  const displayComponent = function (componentsStructure, comp) {
    const { id, componentType } = comp;
    const Component = lunatic[componentType];
    if (componentType !== 'FilterDescription') {
      return (
        <Card
          className={`lunatic lunatic-component ${componentType} ${classes.component}`}
          key={`component-${id}`}
        >
          <div
            className={`lunatic-component outerContainer-${componentType}`}
            key={`component-${id}`}
          >
            <Component
              {...comp}
              handleChange={handleChange}
              preferences={preferences}
              features={features}
              bindings={bindings}
              writable
              currentPage={page}
              setPage={setPage}
              flow={flow}
              pagination={pagination}
            />
            {displaySubComponents(componentsStructure, componentType, id)}
          </div>
        </Card>
      );
    } else {
      return null;
    }
  };

  const displaySubComponents = function (componentsStructure, componentType, compId) {
    const subComponents = componentsStructure[compId];
    if (subComponents && subComponents.length) {
      return (
        <div className={`subElementsInnerContainer-${componentType}`}>
          {subComponents.map(q => displayComponent(componentsStructure, q))}
        </div>
      );
    }
    return null;
  };

  return (
    <Container
      maxWidth="md"
      component="main"
      role="main"
      id="main"
      // ref={topRef}
      className={classes.root}
    >
      {displayComponents()}
      {pagination && (
        <>
          <div className="pagination">
            <Button onClick={goPrevious} disabled={isFirstPage} value="Previous" />
            <Button onClick={goNext} disabled={isLastPage} value="Next" />
          </div>
          <div>{`Page : ${page}/${maxPage}`}</div>
        </>
      )}
    </Container>
  );
};

export default Orchestrator;
