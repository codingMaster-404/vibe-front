import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import VodStudyPage from './pages/VodStudyPage'
import LiveClassroomPage from './pages/LiveClassroomPage'


function App() {
  return (
    <Router>
      <Routes>
        {/* 기본 경로(/)일 때 Dashboard를 보여줍니다 */}
        <Route path="/" element={<Dashboard />} />
        
        {/* 나중에 로그인 페이지를 만들면 아래처럼 추가하면 됩니다 */}
        {/* <Route path="/login" element={<Login />} /> */}
        
        {/* 대시보드 경로를 명시적으로 /dashboard로 쓰고 싶을 때 */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vod-study" element={<VodStudyPage />} />
        <Route path="/live-classroom" element={<LiveClassroomPage />} />
      </Routes>
    </Router>
  );
}

export default App;