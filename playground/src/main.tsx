import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const App = () => <div>hello mini vite</div>;

ReactDOM.render(<App />, document.getElementById('root'));

// @ts-ignore
import.meta.hot.accept(() => {
  ReactDOM.render(<App />, document.getElementById('root'));
});
