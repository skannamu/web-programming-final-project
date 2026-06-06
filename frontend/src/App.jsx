import { useEffect, useState } from "react";

const API_BASE_URL = "";

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const [keypressCount, setKeypressCount] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [tabHiddenCount, setTabHiddenCount] = useState(0);

  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    total_sessions: 0,
    total_duration: 0,
    average_focus_score: 0,
    total_keypress: 0,
    total_click: 0,
    total_tab_hidden: 0,
  });

  useEffect(() => {
    const savedSession = localStorage.getItem("focusguard_current_session");

    if (savedSession) {
      const parsed = JSON.parse(savedSession);

      setIsRunning(parsed.isRunning);
      setTitle(parsed.title);
      setMemo(parsed.memo);
      setStartTime(parsed.startTime);
      setKeypressCount(parsed.keypressCount);
      setClickCount(parsed.clickCount);
      setTabHiddenCount(parsed.tabHiddenCount);
    }

    fetchSessions();
    fetchStats();
  }, []);

  useEffect(() => {
    if (!isRunning || !startTime) return;

    const timer = setInterval(() => {
      const now = Date.now();
      setElapsedTime(Math.floor((now - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, startTime]);

  useEffect(() => {
    if (!isRunning) return;

    const handleKeydown = () => {
      setKeypressCount((prev) => prev + 1);
    };

    const handleClick = () => {
      setClickCount((prev) => prev + 1);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabHiddenCount((prev) => prev + 1);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("click", handleClick);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("click", handleClick);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;

    const currentSession = {
      isRunning,
      title,
      memo,
      startTime,
      keypressCount,
      clickCount,
      tabHiddenCount,
    };

    localStorage.setItem(
      "focusguard_current_session",
      JSON.stringify(currentSession)
    );
  }, [
    isRunning,
    title,
    memo,
    startTime,
    keypressCount,
    clickCount,
    tabHiddenCount,
  ]);

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions`);
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error("세션 조회 실패:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("통계 조회 실패:", error);
    }
  };

  const startSession = () => {
    if (!title.trim()) {
      alert("세션 제목을 입력하세요.");
      return;
    }

    const now = Date.now();

    setIsRunning(true);
    setStartTime(now);
    setElapsedTime(0);
    setKeypressCount(0);
    setClickCount(0);
    setTabHiddenCount(0);
  };

  const calculateFocusScore = () => {
    const score = 100 - tabHiddenCount * 10;
    return Math.max(0, score);
  };

  const endSession = async () => {
    const focusScore = calculateFocusScore();

    const sessionData = {
      userId: 1,
      title,
      duration: elapsedTime,
      keypressCount,
      clickCount,
      tabHiddenCount,
      focusScore,
      memo,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error("세션 저장 실패");
      }

      alert("집중 세션이 저장되었습니다.");

      setIsRunning(false);
      setTitle("");
      setMemo("");
      setStartTime(null);
      setElapsedTime(0);
      setKeypressCount(0);
      setClickCount(0);
      setTabHiddenCount(0);

      localStorage.removeItem("focusguard_current_session");

      fetchSessions();
      fetchStats();
    } catch (error) {
      console.error(error);
      alert("세션 저장 중 오류가 발생했습니다.");
    }
  };

  const deleteSession = async (id) => {
    const ok = confirm("이 세션을 삭제하시겠습니까?");
    if (!ok) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("삭제 실패");
      }

      fetchSessions();
      fetchStats();
    } catch (error) {
      console.error(error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1>FocusGuard</h1>
        <p>웹 기반 집중 행동 기록 플랫폼</p>
      </header>

      <section style={styles.statsSection}>
        <div style={styles.statCard}>
          <strong>{stats.total_sessions}</strong>
          <span>전체 세션</span>
        </div>
        <div style={styles.statCard}>
          <strong>{formatTime(stats.total_duration)}</strong>
          <span>총 집중 시간</span>
        </div>
        <div style={styles.statCard}>
          <strong>{stats.average_focus_score}</strong>
          <span>평균 집중 점수</span>
        </div>
        <div style={styles.statCard}>
          <strong>{stats.total_tab_hidden}</strong>
          <span>총 페이지 이탈</span>
        </div>
      </section>

      <main style={styles.main}>
        <section style={styles.card}>
          <h2>집중 세션</h2>

          <input
            style={styles.input}
            placeholder="예: 데이터베이스 정규화 공부"
            value={title}
            disabled={isRunning}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            style={styles.textarea}
            placeholder="세션 메모를 입력하세요."
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />

          <div style={styles.timer}>{formatTime(elapsedTime)}</div>

          <div style={styles.metrics}>
            <div>
              <strong>{keypressCount}</strong>
              <span>키 입력</span>
            </div>
            <div>
              <strong>{clickCount}</strong>
              <span>클릭</span>
            </div>
            <div>
              <strong>{tabHiddenCount}</strong>
              <span>페이지 이탈</span>
            </div>
            <div>
              <strong>{calculateFocusScore()}</strong>
              <span>집중 점수</span>
            </div>
          </div>

          {!isRunning ? (
            <button style={styles.startButton} onClick={startSession}>
              세션 시작
            </button>
          ) : (
            <button style={styles.endButton} onClick={endSession}>
              세션 종료 및 저장
            </button>
          )}

          <p style={styles.storageNotice}>
            진행 중인 세션은 localStorage에 임시 저장됩니다.
          </p>
        </section>

        <section style={styles.card}>
          <h2>저장된 집중 기록</h2>

          {sessions.length === 0 ? (
            <p>아직 저장된 세션이 없습니다.</p>
          ) : (
            <div style={styles.sessionList}>
              {sessions.map((session) => (
                <div key={session.id} style={styles.sessionItem}>
                  <h3>{session.title}</h3>
                  <p>사용자: {session.user_name}</p>
                  <p>시간: {formatTime(session.duration)}</p>
                  <p>
                    키 입력 {session.keypress_count}회 / 클릭{" "}
                    {session.click_count}회 / 이탈{" "}
                    {session.tab_hidden_count}회
                  </p>
                  <p>집중 점수: {session.focus_score}</p>
                  <p>메모: {session.memo}</p>
                  <button
                    style={styles.deleteButton}
                    onClick={() => deleteSession(session.id)}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f4f6fb",
    color: "#222",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    padding: "32px",
    backgroundColor: "#202938",
    color: "white",
    textAlign: "center",
  },
  statsSection: {
    maxWidth: "1000px",
    margin: "24px auto 0",
    padding: "0 32px",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: "14px",
    padding: "20px",
    textAlign: "center",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  main: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "32px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    height: "100px",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
    boxSizing: "border-box",
    resize: "none",
  },
  timer: {
    fontSize: "48px",
    fontWeight: "bold",
    textAlign: "center",
    margin: "24px 0",
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "24px",
  },
  startButton: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#2563eb",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
  },
  endButton: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#dc2626",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
  },
  deleteButton: {
    marginTop: "8px",
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#6b7280",
    color: "white",
    cursor: "pointer",
  },
  storageNotice: {
    marginTop: "12px",
    fontSize: "13px",
    color: "#666",
  },
  sessionList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxHeight: "520px",
    overflowY: "auto",
  },
  sessionItem: {
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "16px",
    backgroundColor: "#fafafa",
  },
};

export default App;
