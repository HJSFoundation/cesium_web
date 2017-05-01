import React, { Component } from 'react';
import { connect } from 'react-redux';
import { showNotification } from 'baselayer/components/Notifications';
import "../../../node_modules/bokehjs/build/js/bokeh.js";
import "../../../node_modules/bokehjs/build/css/bokeh.css";
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import * as Action from './actions';
import { reduxForm } from 'redux-form';
import { Form, SubmitButton} from './Form';

function bokeh_render_plot(node, docs_json, render_items) {
  // Create bokeh div element
  var bokeh_div = document.createElement("div");
  var inner_div = document.createElement("div");
  bokeh_div.setAttribute("class", "bk-root" );
  inner_div.setAttribute("class", "bk-plotdiv");
  inner_div.setAttribute("id", render_items[0].elementid);
  bokeh_div.appendChild(inner_div);
  node.appendChild(bokeh_div);

  // Generate plot
  Bokeh.safely(function() {
    Bokeh.embed.embed_items(docs_json, render_items);
  });

  // Set zIndex of bokeh html canvas
  var style=document.createElement('style');
  style.type='text/css';
  if(style.styleSheet){
      style.styleSheet.cssText='div.bk-canvas-wrapper{z-index: 0!important;}';
  }else{
      style.appendChild(document.createTextNode('div.bk-canvas-wrapper{z-index: 0!important;}'));
  }
  document.getElementsByTagName('head')[0].appendChild(style);
}


class PlotForm extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(value) {
    this.props.handleSelectChange(value, this.props.featuresetId);
  }

  render() {
    console.log(this.props.fields.featuresToPlot);
    return (
      <div>
        <Form onSubmit={this.props.generatePlot} error={this.props.error}>
          <b>Select Features to Plot</b><br />
              <Select multi simpleValue joinValues value={this.props.featuresToPlot} placeholder="Select features to plot" options={this.props.featuresOptions} onChange={this.handleChange} style={{zIndex: 10}} />
              <SubmitButton
                label="Plot Selected Features"
                submiting={this.props.submitting}
              />
        </Form>
      </div>
    );
  }
};

PlotForm = reduxForm({
  form: 'plot',
  fields: ['featuresToPlot']
}, null)(PlotForm);

const mapStateToProps = (state, ownProps) => {
  console.log("In map state to props")
  var plot = state.plots.filter(plot => (plot.featuresetId === ownProps.featuresetId))[0];
  var featureset = state.featuresets.filter(fs => (fs.id === ownProps.featuresetId))[0];
  var featuresOptions = featureset.features_list.map((feature_name, idx) => {return {value:feature_name, label:feature_name}; });
  if (typeof plot === 'undefined') {
    console.log("featuresToPlot: []");
    return {
      featuresToPlot: [],
      featuresOptions: featuresOptions
    }
  } else {
    console.log("featuresToPlot: ");
    console.log(plot.features)
    return {
      featuresToPlot: plot.features,
      featuresOptions: featuresOptions
      }
  }
};

const pfMapDispatchToProps = dispatch => (
  {
    generatePlot: form => dispatch(Action.generatePlot(form)),
    handleSelectChange: (value, featuresetId) => dispatch(Action.addTagToList(value, featuresetId))
  }
);

PlotForm = connect(mapStateToProps, pfMapDispatchToProps)(PlotForm);


class Plot extends Component {
  constructor(props) {
    super(props);
    this.state = {
      plotData: null
    };
  }

  componentDidMount() {
    fetch(this.props.url, {
      credentials: 'same-origin'
    })
      .then(response => response.json())
      .then((json) => {
        if (json.status == 'success') {
          this.setState({ plotData: json.data });
        } else {
          console.log('dispatching error notification', json.message);
          this.props.dispatch(
            showNotification(json.message, 'error')
          );
        }
      });
  }

  render() {
    const { plotData } = this.state;
    if (!plotData) {
      return <b>Please wait while we load your plotting data...</b>;
    }
    var docs_json = JSON.parse(plotData.docs_json);
    var render_items = JSON.parse(plotData.render_items);

    return (
      plotData &&
        <div
          ref={
            (node) => {
              node && bokeh_render_plot(node, docs_json, render_items)
              }
            }
        />
    );
  }
}
Plot.propTypes = {
  url: React.PropTypes.string.isRequired,
  dispatch: React.PropTypes.func.isRequired
};

Plot = connect()(Plot);

export {Plot, PlotForm};
