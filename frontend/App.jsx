import { useState } from "react";

function App() {
  const [message, setMessage] = useState("FocusGuard 프로젝트 시작!");

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>FocusGuard</h1>
      <p>{message}</p>
      <button onClick={() => setMessage("집중 세션 준비 완료!")}>
        테스트 버튼
      </button>
    </div>
  );
}

export default App;
