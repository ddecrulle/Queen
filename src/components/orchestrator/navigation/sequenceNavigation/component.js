import React, { useState, useCallback, useRef, useEffect } from 'react';
import KeyboardEventHandler from 'react-keyboard-event-handler';
import PropTypes from 'prop-types';
import D from 'i18n';

const SequenceNavigation = ({
  title,
  components,
  setPage,
  setSelectedSequence,
  subSequenceOpen,
  close,
}) => {
  const [currentSequenceId, setCurrentSequenceId] = useState({ undefined });
  const [currentFocusSequenceIndex, setCurrentFocusSequenceIndex] = useState(-1);

  const [listRef] = useState(
    components ? components.reduce(_ => [..._, React.createRef()], []) : []
  );

  const backButtonRef = useRef(null);

  useEffect(() => {
    if (!subSequenceOpen && currentFocusSequenceIndex >= 0) {
      listRef[currentFocusSequenceIndex].current.focus();
      setCurrentSequenceId(undefined);
    }
  }, [subSequenceOpen, currentFocusSequenceIndex, listRef]);

  const setFocusSequence = useCallback(index => () => setCurrentFocusSequenceIndex(index), [
    setCurrentFocusSequenceIndex,
  ]);

  const reachableIndexes = components.reduce((_, { reachable }, index) => {
    if (reachable) return [..._, index];
    return _;
  }, []);
  const lastIndexFocusable = reachableIndexes[reachableIndexes.length - 1];

  const setCurrentFocus = next => index => {
    const indexOfIndex = reachableIndexes.indexOf(index);
    if (next) {
      const nextIndex =
        indexOfIndex + 1 <= reachableIndexes.length - 1 ? reachableIndexes[indexOfIndex + 1] : -1;
      if (nextIndex >= 0) listRef[nextIndex].current.focus();
      else backButtonRef.current.focus();
    } else {
      const previousIndexTemp = indexOfIndex - 1;
      if (previousIndexTemp >= 0) listRef[reachableIndexes[previousIndexTemp]].current.focus();
      else if (previousIndexTemp === -1) backButtonRef.current.focus();
      else if (reachableIndexes.length > 0)
        listRef[reachableIndexes[reachableIndexes.length - 1]].current.focus();
      else backButtonRef.current.focus();
    }
  };

  const openSubComponents = sequence => {
    if (sequence.components && sequence.components.length > 0) {
      if (!currentSequenceId || currentSequenceId !== sequence.id) {
        setSelectedSequence(sequence);
        setCurrentSequenceId(sequence.id);
      }
      if (currentSequenceId === sequence.id) {
        listRef[0].current.focus();
        setSelectedSequence(undefined);
        setCurrentSequenceId(undefined);
      }
    } else if (sequence.reachable) {
      setPage(sequence.page);
    }
  };

  const open = sequence => () => openSubComponents(sequence);

  const handleFinalTab = useCallback(e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      backButtonRef.current.focus();
    }
  }, []);

  const keysToHandle = subSequenceOpen ? ['left', 'esc'] : ['left', 'right', 'esc', 'up', 'down'];
  const keyboardShortcut = (key, e) => {
    const index = currentFocusSequenceIndex;
    if (key === 'right' && currentFocusSequenceIndex >= 0)
      openSubComponents(components[currentFocusSequenceIndex]);
    if (key === 'esc' || key === 'left') {
      if (!subSequenceOpen) close();
      else openSubComponents(components[currentFocusSequenceIndex]);
    }
    if (key === 'down') {
      setCurrentFocus(true)(index);
    }
    if (key === 'up') {
      setCurrentFocus(false)(index);
    }
  };

  return (
    <div className="content">
      <button
        type="button"
        className="back-subnav-btn"
        autoFocus
        ref={backButtonRef}
        onFocus={setFocusSequence(-1)}
        onKeyDown={lastIndexFocusable === -1 ? handleFinalTab : null}
        onClick={close}
      >
        <span>{'\u3008'}</span>
        {D.goBackNavigation}
      </button>
      <h3>{title}</h3>
      <nav role="navigation">
        <ul>
          {components.map((c, index) => {
            return (
              <div className="subnav" key={`subnav-${c.id}`}>
                <button
                  ref={listRef[index]}
                  autoFocus={index === 0}
                  type="button"
                  key={c.id}
                  className={`subnav-btn ${currentFocusSequenceIndex === index ? 'selected' : ''}`}
                  disabled={!c.reachable}
                  onClick={open(c)}
                  onFocus={setFocusSequence(index)}
                  onKeyDown={index === lastIndexFocusable ? handleFinalTab : null}
                >
                  {c.labelNav}
                  <span>{`${c.components.length > 0 ? '\u3009' : ''} `}</span>
                </button>
              </div>
            );
          })}
        </ul>
      </nav>
      <KeyboardEventHandler
        handleKeys={keysToHandle}
        onKeyEvent={keyboardShortcut}
        handleFocusableElements
      />
    </div>
  );
};

SequenceNavigation.propTypes = {
  title: PropTypes.string.isRequired,
  components: PropTypes.arrayOf(PropTypes.any).isRequired,
  setPage: PropTypes.func.isRequired,
  setSelectedSequence: PropTypes.func.isRequired,
  subSequenceOpen: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
};

export default SequenceNavigation;
