import React, { useState, useEffect } from 'react';
import './Home.css';
import { Link, useNavigate } from 'react-router-dom';
import { getAllFacilities, Facility } from '../utils/dataUtils';

const Home: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredFacilities, setFeaturedFacilities] = useState<Facility[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // 獲取前3個機構作為熱門機構
    const facilities = getAllFacilities();
    setFeaturedFacilities(facilities.slice(0, 3));
  }, []);

  // 處理搜尋
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>找到合適的長照機構</h1>
            <p>我們提供全面的長照機構資訊，幫助您或您的家人找到最適合的長照服務</p>
            <form className="search-box" onSubmit={handleSearch}>
              <input 
                type="text" 
                placeholder="輸入機構名稱、地區或服務類型..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-btn">搜尋</button>
            </form>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <h2 className="section-title">我們的服務</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏥</div>
              <h3>機構查詢與篩選</h3>
              <p>依照機構名稱、類型、所在地區及特約服務項目進行精確搜尋</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3>地圖定位查詢</h3>
              <p>透過地圖瀏覽附近長照機構，根據您的所在位置搜尋服務</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h3>詳細機構資訊</h3>
              <p>提供完整的機構資訊、聯絡方式、特約服務項目及合約期限</p>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{getAllFacilities().length}+</div>
              <div className="stat-label">合作機構</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">服務床位</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">25+</div>
              <div className="stat-label">服務縣市</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50,000+</div>
              <div className="stat-label">使用用戶</div>
            </div>
          </div>
        </div>
      </section>

      <section className="featured-section">
        <div className="container">
          <h2 className="section-title">熱門長照機構</h2>
          <div className="featured-grid">
            {featuredFacilities.map(facility => (
              <div className="facility-card" key={facility.id}>
                <h3>{facility.name}</h3>
                <p className="facility-type">機構類型: {facility.type}</p>
                <p className="facility-address">地址: {facility.address}</p>
                <div className="facility-services">
                  {facility.services.slice(0, 2).map((service, index) => (
                    <span className="service-tag" key={index}>{service.name}</span>
                  ))}
                  {facility.services.length > 2 && (
                    <span className="service-tag">+{facility.services.length - 2}項</span>
                  )}
                </div>
                <Link to={`/facility/${facility.id}`} className="view-detail">查看詳情</Link>
              </div>
            ))}
          </div>
          <div className="view-all-link">
            <Link to="/search">查看所有機構 &rarr;</Link>
          </div>
        </div>
      </section>
      
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>需要找到合適的長照服務?</h2>
            <p>我們的平台提供最全面的長照機構資訊，幫助您做出最適合的選擇</p>
            <Link to="/search" className="cta-button">開始搜尋</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 