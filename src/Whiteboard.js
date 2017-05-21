import React from 'react';
import PropTypes from 'react-proptypes';

import Events from './Events';
import * as Constants from './Constants';
import CursorPane from './CursorPane';
import CanvasPane from './CanvasPane';


export default class Whiteboard extends React.Component {

    constructor(props) {
        super(props);

        this.events = props.events || new Events();
        this.state = {
            dataset: [],
            undoStack: [],
            mode: Constants.MODE.HAND,
            strokeWidth: 5,
            strokeColor: 'black',
        };
    }

    getChildContext() {
        return {
            events: this.events,
        };
    }

    componentDidMount() {
        this.setupEventHandler();
    }

    setupEventHandler() {
        this.events.on('start', point => {
            this.startDrawing(point);
        });
        this.events.on('stop', () => {
            this.stopDrawing();
        });

        this.events.on('set', event => {
            if (event.key === 'strokeWidth') {
                this.changeStrokeWidth(event.value);
            }
            if (event.key === 'strokeColor') {
                this.changeStrokeColor(event.value);
            }
        });

        this.events.on('push', point => {
            this.pushPoint(point);
        });
        this.events.on('undo', () => {
            this.undoPoint();
        });
        this.events.on('redo', () => {
            this.redoPoint();
        });
        this.events.on('clear', () => {
            this.clearPoint();
        });
    }

    startDrawing(point) {
        if (this.state.mode === Constants.MODE.LINE) {
            return;
        }

        const dataset = this.state.dataset;
        dataset.push({
            strokeWidth: this.state.strokeWidth,
            strokeColor: this.state.strokeColor,
            values: [point],
        });
        this.setState({
            mode: Constants.MODE.LINE,
            dataset: dataset,
        });
    }

    stopDrawing() {
        if (this.state.mode === Constants.MODE.HAND) {
            return;
        }

        this.setState({
            mode: Constants.MODE.HAND,
        });
    }

    changeStrokeWidth(width) {
        this.setState({
            strokeWidth: width,
        });
    }

    changeStrokeColor(color) {
        this.setState({
            strokeColor: color,
        });
    }

    pushPoint(point) {
        if (this.state.mode === Constants.MODE.HAND) {
            return;
        }

        const dataset = this.state.dataset;
        const current = dataset[dataset.length - 1];

        if (current &&
            current.strokeWidth === this.state.strokeWidth &&
            current.strokeColor === this.state.strokeColor) {
            current.values.push(point);
            this.setState({
                dataset: dataset,
                undoStack: [],
            });
        } else {
            dataset.push({
                strokeWidth: this.state.strokeWidth,
                strokeColor: this.state.strokeColor,
                values: [point],
            });
            this.setState({
                dataset: dataset,
                undoStack: [],
            });
        }
    }

    undoPoint() {
        const dataset = this.state.dataset;
        const current = dataset[dataset.length - 1];
        const undoStack = this.state.undoStack;

        if (current && current.values.length > 1) {
            const point = current.values.pop();
            const undoOperation = (newState) => {
                const dataset = this.state.dataset;
                const current = dataset[dataset.length - 1];
                current.values.push(point);
                newState.dataset = dataset;
                this.setState(newState);
            };
            undoStack.push(undoOperation);
            this.setState({
                dataset: dataset,
                undoStack: undoStack,
            });

        } else if (current && current.values.length === 1) {
            dataset.pop();
            const undoOperation = (newState) => {
                const dataset = this.state.dataset;
                dataset.push(current);
                newState.dataset = dataset;
                this.setState(newState);
            };
            undoStack.push(undoOperation);
            this.setState({
                dataset: dataset,
                undoStack: undoStack,
            });
        }
    }

    redoPoint() {
        const undoStack = this.state.undoStack;
        const redoOperation = undoStack.pop();
        if (redoOperation) {
            redoOperation({
                undoStack: undoStack,
            });
        }
    }

    clearPoint() {
        this.setState({
            dataset: [],
            undoStack: [],
        });
    }

    render() {
        const wrapperStyle = {
            position: 'relative',
            width: this.props.width,
            height: this.props.height,
        };

        return (
            <div style={wrapperStyle}>
                <CursorPane {...this.props} {...this.state}></CursorPane>
                <CanvasPane {...this.props} {...this.state}></CanvasPane>
            </div>
        );
    }
}

Whiteboard.propTypes = {
    events: PropTypes.object,
    width: PropTypes.number,
    height: PropTypes.number,
    style: PropTypes.shape({
        backgroundColor: PropTypes.string,
    }),
};

Whiteboard.childContextTypes = {
    events: PropTypes.object,
};
