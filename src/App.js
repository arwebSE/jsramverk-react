import './App.css';

// import { BrowserRouter as Router, Route } from 'react-router-dom';
import Editor from './Components/Editor'

const App = () => {
    return (
        <div className="container">
            {/* <Router>
                <Route exact path="/" component={Editor} />
            </Router> */}
            <Editor />
        </div>
    );
}

export default App;
