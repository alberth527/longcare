import { useState, useEffect } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import FacilityDetail from './pages/FacilityDetail'
import MapSearch from './pages/MapSearch'
import { filterFacilities, getAllFacilityTypes, getAllRegions, getAllServiceTypes, Facility } from './utils/dataUtils'

function App() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [facilityTypes, setFacilityTypes] = useState<string[]>([])
  const [regions, setRegions] = useState<string[]>([])
  const [serviceTypes, setServiceTypes] = useState<string[]>([])
  const [filters, setFilters] = useState({
    type: '',
    region: '',
    service: ''
  })

  useEffect(() => {
    // 載入所有設施數據
    const allFacilities = filterFacilities();
    setFacilities(allFacilities);

    // 載入篩選選項
    setFacilityTypes(getAllFacilityTypes());
    setRegions(getAllRegions());
    setServiceTypes(getAllServiceTypes());
  }, []);

  // 處理篩選變更
  const handleFilterChange = (filterType: 'type' | 'region' | 'service', value: string) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    setFacilities(filterFacilities(newFilters.type, newFilters.region, newFilters.service));
  };

  // 應用篩選按鈕點擊
  const applyFilters = () => {
    setFacilities(filterFacilities(filters.type, filters.region, filters.service));
  };

  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <div className="container">
            <h1>長照機構查詢系統</h1>
            <nav>
              <ul className="nav-menu">
                <li><Link to="/">首頁</Link></li>
                <li><Link to="/search">機構查詢</Link></li>
                <li><Link to="/map">地圖查詢</Link></li>
                <li><Link to="/about">關於我們</Link></li>
              </ul>
            </nav>
          </div>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={
              <section id="search" className="search-section">
                <div className="container">
                  <h2 className="section-title">機構查詢</h2>
                  <div className="filter-container">
                    <div className="filter-group">
                      <label>機構種類</label>
                      <select 
                        value={filters.type} 
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                      >
                        <option value="">全部</option>
                        {facilityTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group">
                      <label>地區</label>
                      <select 
                        value={filters.region} 
                        onChange={(e) => handleFilterChange('region', e.target.value)}
                      >
                        <option value="">全部地區</option>
                        {regions.map(region => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group">
                      <label>服務項目</label>
                      <select 
                        value={filters.service} 
                        onChange={(e) => handleFilterChange('service', e.target.value)}
                      >
                        <option value="">全部服務</option>
                        {serviceTypes.map(service => (
                          <option key={service} value={service}>{service}</option>
                        ))}
                      </select>
                    </div>
                    <button className="apply-filter" onClick={applyFilters}>應用篩選</button>
                  </div>

                  <div className="results-container">
                    {facilities.length === 0 ? (
                      <p className="no-results">沒有符合條件的機構</p>
                    ) : (
                      facilities.map(facility => (
                        <div key={facility.id} className="facility-card">
                          <h3>{facility.name}</h3>
                          <p className="facility-type">機構類型: {facility.type}</p>
                          <p className="facility-address">地址: {facility.address}</p>
                          <p className="facility-contact">電話: {facility.phone}</p>
                          <div className="facility-services">
                            {facility.services.map((service, index) => (
                              <span key={index} className="service-tag">{service.name}</span>
                            ))}
                          </div>
                          <Link to={`/facility/${facility.id}`} className="view-detail">查看詳情</Link>
                        </div>
                      ))
                    )}
                  </div>

                  {facilities.length > 0 && (
                    <div className="pagination">
                      <a href="#" className="page-link active">1</a>
                      <a href="#" className="page-link">2</a>
                      <a href="#" className="page-link">3</a>
                      <a href="#" className="page-link next">下一頁</a>
                    </div>
                  )}
                </div>
              </section>
            } />
            <Route path="/map" element={<MapSearch />} />
            <Route path="/facility/:id" element={<FacilityDetail />} />
            <Route path="/about" element={
              <section className="about-section">
                <div className="container">
                  <h2 className="section-title">關於我們</h2>
                  <div className="about-content">
                    <p>長照機構查詢系統旨在幫助需要長期照護服務的人士和家庭，快速找到合適的長照機構和服務。</p>
                    <p>我們提供全面的長照機構資訊，包括機構名稱、種類、地址、聯絡方式、負責人資訊、特約服務項目以及服務合約期間等詳細資料。</p>
                    <p>透過我們的平台，用戶可以輕鬆搜尋和篩選機構，查看地圖位置，並獲取有關長照服務的全面資訊。</p>
                  </div>
                </div>
              </section>
            } />
          </Routes>
        </main>

        <footer className="app-footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-about">
                <h3>關於我們</h3>
                <p>長照機構查詢系統旨在幫助需要長期照護服務的人士和家庭，快速找到合適的長照機構和服務。</p>
              </div>
              <div className="footer-contact">
                <h3>聯絡我們</h3>
                <p>電子郵件: info@longcare.example.com</p>
                <p>客服電話: 02-12345678</p>
              </div>
            </div>
            <div className="copyright">
              <p>© 2023 長照機構查詢系統. 保留所有權利.</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default App
