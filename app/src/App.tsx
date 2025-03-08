import logo from "./logo.svg";
import "./App.css";

function App() {
  function playBase64Audio(base64String: string) {
    const audio = new Audio(`data:audio/mp3;base64,${base64String}`);
    audio.play().catch((error) => console.error("Error playing audio:", error));
  }

  function play() {
    playBase64Audio('the base64 string');
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <button onClick={play}>Play</button>
      </header>
    </div>
  );
}

export default App;
