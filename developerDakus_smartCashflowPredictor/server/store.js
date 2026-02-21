/**
 * In-memory shared data store.
 * Holds the most recently uploaded financial analysis result
 * so the health score endpoint can access it.
 */

let lastResult = null;

const setLastResult = (result) => {
    lastResult = result;
};

const getLastResult = () => lastResult;

module.exports = { setLastResult, getLastResult };
