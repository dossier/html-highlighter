// @flow

const globals = {
  verbose: false,
  debugging: false,
};

function setVerbose(active: boolean): void {
  globals.verbose = active;
}

function getVerbose(): boolean {
  return globals.verbose;
}

function setDebugging(active: boolean): void {
  globals.debugging = active;
}

function getDebugging(): boolean {
  return globals.debugging;
}

export default globals;
export { setVerbose, getVerbose, setDebugging, getDebugging };
