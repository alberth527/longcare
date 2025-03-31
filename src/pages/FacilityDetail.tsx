import React, { useEffect, useState, useRef } from 'react';
import './FacilityDetail.css';
import { useParams, useNavigate } from 'react-router-dom';
import { getFacilityById, Facility } from '../utils/dataUtils';

// 聲明全局L變量（因為Leaflet通過CDN加載）
declare const L: any;

// 設施詳情地圖組件
const FacilityMap: React.FC<{ facility: Facility }> = ({ facility }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [routeDistance, setRouteDistance] = useState<string | null>(null);
  const [routeDuration, setRouteDuration] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 初始化地圖
  useEffect(() => {
    if (!mapRef.current || !facility.location || !facility.location.lat || !facility.location.lng) {
      return;
    }
    
    console.log('初始化設施詳情地圖...');
    
    // 确保地图容器已经可见并有尺寸
    setTimeout(() => {
      try {
        // 地圖中心設為設施位置
        const facilityLocation: [number, number] = [
          facility.location!.lat,
          facility.location!.lng
        ];
        
        // 初始化地圖
        const newMap = L.map(mapRef.current, {
          center: facilityLocation,
          zoom: 15,
          attributionControl: true,
          zoomControl: true
        });
        
        // 添加OpenStreetMap圖層
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(newMap);
        
        // 添加設施標記
        const facilityMarker = L.marker(facilityLocation, {
          title: facility.name,
          icon: L.divIcon({
            className: `facility-marker facility-type-${facility.type}`,
            html: `<div class="marker-content">${getMarkerIcon(facility.type)}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
          })
        }).addTo(newMap);
        
        // 添加彈出信息窗口
        facilityMarker.bindPopup(`
          <div class="custom-popup">
            <h3>${facility.name}</h3>
            <p>${facility.address}</p>
            <p><strong>電話:</strong> ${facility.phone}</p>
          </div>
        `).openPopup();
        
        // 刷新地圖容器以確保正確加載
        newMap.invalidateSize();
        
        setMap(newMap);
        
        console.log('地圖初始化完成');
      } catch (error) {
        console.error('地圖初始化失敗:', error);
      }
    }, 300); // 添加延遲確保DOM已完全渲染
    
    // 清理函數
    return () => {
      if (map) {
        console.log('清理地圖...');
        map.remove();
      }
    };
  }, [facility]);
  
  // 獲取用戶當前位置
  const getUserLocation = () => {
    setIsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setIsLoading(false);
        },
        (error) => {
          console.error('無法獲取位置:', error);
          alert(`無法獲取您的位置: ${error.message || '請確保您的瀏覽器已允許位置權限'}`);
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert('您的瀏覽器不支持地理位置功能');
      setIsLoading(false);
    }
  };
  
  // 當用戶位置更新時，更新地圖
  useEffect(() => {
    if (!map || !userLocation || !facility.location) return;
    
    // 用戶位置
    const userLatLng: [number, number] = [userLocation.lat, userLocation.lng];
    
    // 清除舊的標記和路線
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker && layer.options.title === '您的位置') {
        map.removeLayer(layer);
      }
      if (layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });
    
    // 添加用戶位置標記
    const userMarker = L.marker(userLatLng, {
      title: '您的位置',
      icon: L.divIcon({
        className: 'user-location-marker',
        html: '<div class="pulse"></div>',
        iconSize: [20, 20]
      })
    }).addTo(map);
    
    userMarker.bindPopup('您的位置').openPopup();
    
    // 設施位置
    const facilityLatLng: [number, number] = [facility.location.lat, facility.location.lng];
    
    // 計算設施到用戶的距離
    const distance = map.distance(userLatLng, facilityLatLng) / 1000;
    setRouteDistance(`${distance.toFixed(1)} 公里`);
    
    // 估計行車時間（假設平均車速為40km/h）
    const durationInMinutes = (distance / 40) * 60;
    setRouteDuration(`${Math.ceil(durationInMinutes)} 分鐘`);
    
    // 獲取行駛路線
    getRoute(userLatLng, facilityLatLng);
    
    // 調整地圖視圖以顯示用戶位置和設施
    const bounds = L.latLngBounds(userLatLng, facilityLatLng);
    map.fitBounds(bounds, { padding: [50, 50] });
    
  }, [map, userLocation, facility]);
  
  // 獲取行駛路線
  const getRoute = async (startPoint: [number, number], endPoint: [number, number]) => {
    try {
      console.log('獲取路線: 從', startPoint, '到', endPoint);
      
      // 首先添加直線作為默認路線
      const straightLine = L.polyline([startPoint, endPoint], {
        color: '#ff6b6b',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10'
      }).addTo(map);
      
      // 使用OSRM API獲取路線
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${startPoint[1]},${startPoint[0]};${endPoint[1]},${endPoint[0]}?overview=full&geometries=geojson`);
      
      if (!response.ok) {
        throw new Error('無法獲取路線數據');
      }
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        // 移除直線路線
        map.removeLayer(straightLine);
        
        // 繪製路線 - 使用GeoJSON格式
        try {
          
          
          // 更新距離和時間
          const distance = data.routes[0].distance / 1000;
          const duration = Math.ceil(data.routes[0].duration / 60);
          
          setRouteDistance(`${distance.toFixed(1)} 公里`);
          setRouteDuration(`${duration} 分鐘`);
          
          console.log('路線獲取成功，距離:', distance, 'km, 時間:', duration, 'min');
        } catch (err) {
          console.error('路線數據處理錯誤:', err);
        }
      }
    } catch (error) {
      console.error('獲取路線失敗:', error);
      
      // 更新簡單的直線距離和預計時間
      const distance = map.distance(startPoint, endPoint) / 1000;
      setRouteDistance(`${distance.toFixed(1)} 公里（直線距離）`);
      
      // 估計行車時間（假設平均車速為40km/h）
      const durationInMinutes = (distance / 40) * 60;
      setRouteDuration(`${Math.ceil(durationInMinutes)} 分鐘（預估）`);
    }
  };
  
  // 在Google地圖中打開方向
  const openDirectionsInGoogleMaps = () => {
    if (!facility.location) return;
    
    const destination = `${facility.location.lat},${facility.location.lng}`;
    const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : '';
    
    // 構建Google地圖方向URL
    let googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    if (origin) {
      googleMapsUrl += `&origin=${origin}`;
    }
    
    // 在新窗口中打開Google地圖
    window.open(googleMapsUrl, '_blank');
  };
  
  // 如果沒有位置信息，顯示提示
  if (!facility.location || !facility.location.lat || !facility.location.lng) {
    return (
      <div className="map-placeholder">
        <p>無法顯示地圖</p>
        <p>（此機構未提供位置資訊）</p>
      </div>
    );
  }
  
  return (
    <div className="facility-map-container">
      <div className="facility-map" ref={mapRef} style={{ width: '100%', height: '250px' }}></div>
      
      {/* 調試信息 */}
      <div className="debug-info" style={{ fontSize: '12px', color: '#666', padding: '5px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginTop: '5px' }}>
        <p>地圖狀態: {map ? '已初始化' : '未初始化'}</p>
        <p>設施位置: 緯度 {facility.location.lat.toFixed(6)}, 經度 {facility.location.lng.toFixed(6)}</p>
      </div>
      
      <div className="map-actions">
        <button
          className="get-directions-btn"
          onClick={getUserLocation}
          disabled={isLoading}
        >
          {isLoading ? '獲取位置中...' : '從我的位置出發'}
        </button>
        {userLocation && (
          <button
            className="open-google-maps-btn"
            onClick={openDirectionsInGoogleMaps}
          >
            在Google地圖中開啟
          </button>
        )}
      </div>
      {userLocation && routeDistance && routeDuration && (
        <div className="route-info">
          <div className="route-stat">
            <span className="route-icon">📏</span>
            <span>距離: {routeDistance}</span>
          </div>
          <div className="route-stat">
            <span className="route-icon">⏱️</span>
            <span>預計行車時間: {routeDuration}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const FacilityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const facilityData = getFacilityById(id);
      if (facilityData) {
        // 檢查位置資料有效性
        if (facilityData.location) {
          console.log('設施位置資料:', facilityData.location);
          
          // 如果位置資料不完整，嘗試添加模擬位置
          if (!facilityData.location.lat || !facilityData.location.lng) {
            console.warn('設施缺少經緯度資料，使用模擬位置');
            facilityData.location = {
              ...facilityData.location,
              lat: 25.033,  // 台北市中心緯度
              lng: 121.565  // 台北市中心經度
            };
          }
        } else {
          console.warn('設施完全缺少位置資料，添加模擬位置');
          facilityData.location = {
            lat: 25.033,
            lng: 121.565
          };
        }
        
        setFacility(facilityData);
      }
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return <div className="loading">載入中...</div>;
  }

  if (!facility) {
    return (
      <div className="facility-not-found">
        <div className="container">
          <h2>找不到機構資訊</h2>
          <p>抱歉，找不到所請求的機構資訊。</p>
          <button onClick={() => navigate(-1)}>返回上一頁</button>
        </div>
      </div>
    );
  }

  return (
    <div className="facility-detail-page">
      <div className="container">
        <div className="back-link">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate(-1); }}>
            &larr; 返回搜尋結果
          </a>
        </div>

        <div className="facility-header">
          <div className="facility-header-info">
            <h1>{facility.name}</h1>
            <div className="facility-meta">
              <span className="facility-code">機構代碼: {facility.code}</span>
              <span className="facility-type">機構類型: {facility.type}</span>
            </div>
          </div>
        </div>

        <div className="facility-detail-container">
          <div className="facility-main-info">
            <div className="info-section">
              <h2>機構資訊</h2>
              <div className="info-grid">
                <div className="info-item">
                  <strong>地址:</strong>
                  <p>{facility.address}</p>
                </div>
                <div className="info-item">
                  <strong>聯絡電話:</strong>
                  <p>{facility.phone}</p>
                </div>
                <div className="info-item">
                  <strong>電子郵件:</strong>
                  <p>{facility.email}</p>
                </div>
                <div className="info-item">
                  <strong>負責人:</strong>
                  <p>{facility.manager}</p>
                </div>
                <div className="info-item">
                  <strong>合約期間:</strong>
                  <p>{facility.contractStartDate} 至 {facility.contractEndDate}</p>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h2>機構介紹</h2>
              <p className="facility-description">{facility.description}</p>
            </div>

            <div className="info-section">
              <h2>特約服務項目</h2>
              <div className="services-table">
                <table>
                  <thead>
                    <tr>
                      <th>服務項目</th>
                      <th>特約起始日</th>
                      <th>特約截止日</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facility.services.map((service, index) => (
                      <tr key={index}>
                        <td>{service.name}</td>
                        <td>{service.startDate}</td>
                        <td>{service.endDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="info-section">
              <h2>機構設施</h2>
              <div className="facility-tags">
                {facility.facilities && facility.facilities.map((item, index) => (
                  <span className="facility-tag" key={index}>{item}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="facility-sidebar">
            <div className="map-widget">
              <h3>機構位置</h3>
              <FacilityMap facility={facility} />
            </div>

            <div className="contact-widget">
              <h3>聯絡方式</h3>
              <div className="contact-list">
                <div className="contact-item">
                  <span className="contact-icon">📞</span>
                  <span className="contact-text">{facility.phone}</span>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">✉️</span>
                  <span className="contact-text">{facility.email}</span>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📍</span>
                  <span className="contact-text">{facility.address}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 獲取標記圖標
const getMarkerIcon = (type: string): string => {
  const iconMap: { [key: string]: string } = {
    '1': '🏠', // 居家式服務
    'A1': '🏥', // 老人養護中心
    'A3': '🏥', // 護理之家
    'B1': '💉', // 居家護理所
    'B2': '🏥', // 醫院或診所
    'BF': '🏢', // 社區發展協會
  };
  
  return iconMap[type] || '📍';
};

export default FacilityDetail; 