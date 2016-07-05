import { combineReducers } from 'redux'
import {reducer as formReducer} from 'redux-form'

import * as Action from './actions'


function projects(state={projectList: []}, action) {
  switch (action.type) {
    case Action.RECEIVE_PROJECTS:
      return {...state, projectList: action.payload}
    default:
      return state
  }
}


function datasets(state = [], action) {
  switch (action.type) {
    case Action.RECEIVE_DATASETS:
      return action.payload
    default:
      return state
  }
}


function featuresets(state = [], action) {
  switch (action.type) {
    case Action.RECEIVE_FEATURESETS:
      return action.payload
    // case CLEAR_FEATURES_FORM:
    //  return {
    default:
      return state
  }
}


function models(state, action) {
  switch (action.type) {
  default:
      return {formFields: {}}
  }
}

function notifications(state={notes: []}, action) {
  switch (action.type) {
    case Action.SHOW_NOTIFICATION:
      return {
        notes: state.notes.concat(action.payload)
      }
    case Action.HIDE_NOTIFICATION:
      return {
        notes: state.notes.slice(1)
      }
    default:
      return state
  }
}


let myFormReducer = (theirFormReducer) => {
  return function(state, action) {
    var state = {...state};
    switch (action.type) {
      case Action.SELECT_PROJECT:
        const {id} = action.payload;
        state.projectSelector.project.value = id.toString();
    }
    return theirFormReducer(state, action);
  }
}


function expander(state={opened: {}}, action) {
  let id = action.payload ? action.payload.id : null;
  let newState = {...state};

  switch (action.type) {
    case Action.TOGGLE_EXPANDER:
      newState.opened[id] = !state.opened[id];
      return newState;
    case Action.HIDE_EXPANDER:
      newState.opened[id] = false;
      return newState;
    case Action.SHOW_EXPANDER:
      newState.opened[id] = true;
      return newState;
    default:
      return state
  }
}


const rootReducer = combineReducers({
  projects,
  datasets,
  featuresets,
  models,
  notifications,
  expander,
  form: myFormReducer(formReducer)
})

export default rootReducer
