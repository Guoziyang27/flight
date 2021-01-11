import main from './main'
import React from 'react'
import './App.css'
import {onSubmit} from "./UploadFile";

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
                <form>
                    <label>
                        OBJ:
                        <input id="obj-reader" type="file" name="name" />
                        MTL:
                        <input id="mtl-reader" type="file" name="name" />
                    </label>
                    <input type="button" value="Submit" onClick={onSubmit} />
                </form>
            </div>
        );
    }
}

export default App;
