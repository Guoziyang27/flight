import main from './main'
import React from 'react'
import './App.css'

class App extends React.Component {
    componentDidMount() {
        main();
    }

    render() {
        return (
            <div tabindex="0" id="canvas-div">
                <canvas
                    id="glcanvas"
                    width="1200"
                    height="600">
                    你的浏览器似乎不支持或者禁用了HTML5 <code>&lt;canvas&gt;</code> 元素.
                </canvas>
            </div>
        );
    }
}

export default App;
