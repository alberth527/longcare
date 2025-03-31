import React, { useState, useEffect, useRef } from 'react';
import './MapSearch2.css';
import { filterFacilities, getAllFacilityTypes, getAllServiceTypes, Facility } from '../utils/dataUtils';
import { Link } from 'react-router-dom';
// Leaflet已通過CDN添加到index.html

// 聲明全局L變量（因為Leaflet通過CDN加載）
declare const L: any;

// 地圖組件，將地圖相關邏輯封裝到單獨的組件中
const LeafletMap: React.FC<{
  facilities: Facility[];
  selectedFacility: Facility | null;
  onFacilityClick: (facility: Facility) => void;
  userLocation?: { lat: number; lng: number } | null;
}> = ({ facilities, selectedFacility, onFacilityClick, userLocation }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any | null>(null);
  const [markerCluster, setMarkerCluster] = useState<any | null>(null);
  const [userMarker, setUserMarker] = useState<any | null>(null);
  
  // 初始化地圖
  useEffect(() => {
    if (!mapRef.current || map) return;
    
    console.log('初始化地圖組件...');
    
    // 初始化地圖，將中心點設置在台灣中心位置
    const newMap = L.map(mapRef.current).setView([23.6978, 120.9605], 7);
    
    // 添加OpenStreetMap圖層
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(newMap);
    
    // 創建標記聚合器
    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      iconCreateFunction: function(cluster: any) {
        const count = cluster.getChildCount();
        let size = 'small';
        
        if (count > 20) {
          size = 'large';
        } else if (count > 10) {
          size = 'medium';
        }
        
        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster marker-cluster-${size}`,
          iconSize: L.point(40, 40)
        });
      }
    });
    
    // 將聚合器添加到地圖
    newMap.addLayer(cluster);
    
    setMap(newMap);
    setMarkerCluster(cluster);
    
    // 清理函數
    return () => {
      console.log('清理地圖組件...');
      if (newMap) {
        newMap.remove();
      }
    };
  }, []);
  
  // 更新設施標記
  useEffect(() => {
    if (!map || !markerCluster) return;
    
    console.log('更新設施標記...');
    // 清除現有標記
    markerCluster.clearLayers();
    
    // 添加新標記
    facilities.forEach(facility => {
      if (facility.location && facility.location.lat && facility.location.lng) {
        const marker = L.marker([facility.location.lat, facility.location.lng], {
          title: facility.name,
          icon: L.divIcon({
            className: `facility-marker facility-type-${facility.type}`,
            html: `<div class="marker-content">${getMarkerIcon(facility.type)}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
          })
        }).bindPopup(`
          <div class="custom-popup">
            <h3>${facility.name}</h3>
            <p><strong>類型:</strong> ${getTypeDisplayName(facility.type)}</p>
            <p><strong>地址:</strong> ${facility.address}</p>
            <p><strong>電話:</strong> ${facility.phone}</p>
            <p><strong>服務:</strong> ${facility.services.map(s => s.name).join(', ')}</p>
            <div class="popup-actions">
              <a href="#/facility/${facility.id}" target="_blank" class="popup-link">查看詳情</a>
            </div>
          </div>
        `, {
          maxWidth: 300,
          minWidth: 200,
          autoPan: true
        });
          
        marker.on('click', () => {
          onFacilityClick(facility);
        });
        
        // 將標記添加到聚合器
        markerCluster.addLayer(marker);
      }
    });
    
    // 如果有設施，調整地圖視圖以適應所有標記
    if (markerCluster.getLayers().length > 0) {
      try {
        const bounds = markerCluster.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (error) {
        console.error('無法調整地圖視圖:', error);
      }
    }
  }, [facilities, map, markerCluster, onFacilityClick]);
  
  // 更新選中的設施
  useEffect(() => {
    if (!map || !markerCluster || !selectedFacility) return;
    
    if (selectedFacility.location && selectedFacility.location.lat && selectedFacility.location.lng) {
      map.setView([selectedFacility.location.lat, selectedFacility.location.lng], 16);
      
      // 找到對應的標記並打開彈窗
      markerCluster.eachLayer((layer: any) => {
        if (layer.getLatLng().lat === selectedFacility.location?.lat && 
            layer.getLatLng().lng === selectedFacility.location?.lng) {
          // 使用延時以確保地圖已經移動到位置
          setTimeout(() => {
            layer.openPopup();
          }, 500);
        }
      });
    }
  }, [selectedFacility, map, markerCluster]);
  
  // 更新用戶位置
  useEffect(() => {
    if (!map || !userLocation) return;
    
    // 清除舊的用戶標記
    if (userMarker) {
      userMarker.remove();
    }
    
    // 創建新的用戶位置標記
    const newUserMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: L.divIcon({
        className: 'user-location-marker',
        html: '<div class="pulse"></div>',
        iconSize: [30, 30]
      })
    }).addTo(map)
      .bindPopup('您的位置')
      .openPopup();
      
    setUserMarker(newUserMarker);
    
    // 更新地圖視圖
    map.setView([userLocation.lat, userLocation.lng], 13);
  }, [userLocation, map]);
  
  return <div className="leaflet-container" ref={mapRef}></div>;
};

const MapSearch: React.FC = () => {
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilityTypes, setFacilityTypes] = useState<string[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    type: '',
    service: '',
    radius: '3'
  });
  const [searchLocation, setSearchLocation] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  
  useEffect(() => {
    // 載入設施數據和篩選選項
    const allFacilities = filterFacilities();
    
    // 為每個設施添加模擬距離
    const facilitiesWithDistance = allFacilities.map(facility => ({
      ...facility,
      distance: (Math.random() * 10).toFixed(1)
    }));
    
    setFacilities(facilitiesWithDistance);
    setFacilityTypes(getAllFacilityTypes());
    setServiceTypes(getAllServiceTypes());
  }, []);

  // 模擬請求用戶定位權限
  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationPermission(true);
          
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          // 計算設施到用戶的距離
          const facilitiesWithActualDistance = facilities.map(facility => {
            if (facility.location && facility.location.lat && facility.location.lng) {
              const facilityLatLng = L.latLng(facility.location.lat, facility.location.lng);
              const userLatLng = L.latLng(latitude, longitude);
              const distanceInKm = (facilityLatLng.distanceTo(userLatLng) / 1000).toFixed(1);
              return { ...facility, distance: distanceInKm };
            }
            return facility;
          });
          
          // 按距離排序
          const sortedFacilities = [...facilitiesWithActualDistance].sort((a, b) => 
            parseFloat(a.distance as string) - parseFloat(b.distance as string)
          );
          
          setFacilities(sortedFacilities);
          
          // 根據半徑篩選最近的設施
          const maxDistance = parseFloat(filters.radius);
          const nearbyFacilities = sortedFacilities.filter(
            f => f.distance && parseFloat(f.distance) <= maxDistance
          );
          
          setFacilities(nearbyFacilities);
        },
        (error) => {
          console.error('獲取位置失敗:', error);
          setLocationPermission(false);
          
          // 顯示錯誤提示
          alert(`無法獲取位置: ${error.message || '請確保您的瀏覽器已允許位置權限'}`);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      console.error('瀏覽器不支持地理位置API');
      setLocationPermission(false);
      
      // 顯示錯誤提示
      alert('您的瀏覽器不支持地理位置功能');
    }
  };

  // 處理篩選變更
  const handleFilterChange = (filterType: 'type' | 'service' | 'radius', value: string) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    
    // 應用篩選
    let filtered = filterFacilities(newFilters.type === '長照機構' ? '' : newFilters.type, '', newFilters.service);
    
    // 為篩選後的設施添加距離（如果用戶已經共享位置，使用實際距離）
    if (locationPermission && userLocation) {
      // 已經有距離信息，只需根據半徑篩選
      filtered = filtered.map(facility => {
        if (facility.location && facility.location.lat && facility.location.lng) {
          const facilityLatLng = L.latLng(facility.location.lat, facility.location.lng);
          const userLatLng = L.latLng(userLocation.lat, userLocation.lng);
          const distanceInKm = (facilityLatLng.distanceTo(userLatLng) / 1000).toFixed(1);
          return { ...facility, distance: distanceInKm };
        }
        return { ...facility, distance: '999' };
      });
      
      // 根據半徑篩選
      const maxDistance = parseFloat(newFilters.radius);
      filtered = filtered.filter(facility => 
        parseFloat(facility.distance as string) <= maxDistance
      );
    } else {
      // 使用模擬距離
      filtered = filtered.map(facility => ({
        ...facility,
        distance: facility.distance || (Math.random() * 10).toFixed(1)
      }));
      
      // 根據半徑篩選
      const maxDistance = parseFloat(newFilters.radius);
      filtered = filtered.filter(facility => 
        parseFloat(facility.distance as string) <= maxDistance
      );
    }
    
    setFacilities(filtered);
  };

  // 處理位置搜尋
  const handleLocationSearch = () => {
    if (searchLocation.trim()) {
      // 使用Nominatim服務（OpenStreetMap的地理編碼服務）搜尋地址
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation + ' 台灣')}&limit=1`)
        .then(response => response.json())
        .then(data => {
          if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lon);
            
            // 設置搜尋位置
            setUserLocation({ lat: latitude, lng: longitude });
            
            // 計算設施到搜尋位置的距離
            const allFacilities = filterFacilities();
            const facilitiesWithDistance = allFacilities.map(facility => {
              if (facility.location && facility.location.lat && facility.location.lng) {
                const facilityLatLng = L.latLng(facility.location.lat, facility.location.lng);
                const searchLatLng = L.latLng(latitude, longitude);
                const distanceInKm = (facilityLatLng.distanceTo(searchLatLng) / 1000).toFixed(1);
                return { ...facility, distance: distanceInKm };
              }
              return { ...facility, distance: '999' }; // 無位置信息的設施設置一個很大的距離
            });
            
            // 按距離排序
            const sortedFacilities = [...facilitiesWithDistance].sort((a, b) => 
              parseFloat(a.distance as string) - parseFloat(b.distance as string)
            );
            
            // 根據半徑篩選最近的設施
            const maxDistance = parseFloat(filters.radius);
            const nearbyFacilities = sortedFacilities.filter(
              f => parseFloat(f.distance as string) <= maxDistance
            );
            
            setFacilities(nearbyFacilities);
          } else {
            alert('找不到該位置，請嘗試其他搜尋詞');
          }
        })
        .catch(error => {
          console.error('位置搜尋錯誤:', error);
          alert('搜尋位置時發生錯誤');
        });
    }
  };

  // 在地圖上顯示選定的設施
  const handleFacilityClick = (facility: Facility) => {
    setSelectedFacility(facility);
  };

  return (
    <div className="map-search-page">
      <div className="container">
        <h1 className="page-title">地圖查詢</h1>
        <p className="page-description">使用地圖查找您附近的長照機構，或在特定區域搜尋</p>

        <div className="map-search-container">
          <div className="map-filters">
            <div className="search-input-group">
              <input 
                type="text" 
                placeholder="輸入地址或區域..." 
                className="location-input"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
              />
              <button 
                className="search-location-btn"
                onClick={handleLocationSearch}
              >
                搜尋此區域
              </button>
            </div>
            
            <div className="filter-row">
              <div className="filter-group">
                <label>機構種類</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="">全部類型</option>
                  {facilityTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>搜尋半徑</label>
                <select
                  value={filters.radius}
                  onChange={(e) => handleFilterChange('radius', e.target.value)}
                >
                  <option value="1">1公里</option>
                  <option value="3">3公里</option>
                  <option value="5">5公里</option>
                  <option value="10">10公里</option>
                  <option value="20">20公里</option>
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
            </div>
            
            <div className="current-location">
              {locationPermission === null ? (
                <button className="locate-me-btn" onClick={requestLocation}>
                  使用我的當前位置
                </button>
              ) : locationPermission ? (
                <div className="location-status success">
                  ✓ 已使用您的當前位置
                </div>
              ) : (
                <div className="location-status error">
                  ✗ 無法獲取您的位置，請允許位置權限
                </div>
              )}
            </div>
          </div>
          
          <div className="map-view-container">
            <div className="map-sidebar">
              <h3>附近的長照機構 ({facilities.length})</h3>
              <div className="nearby-list">
                {facilities.length === 0 ? (
                  <p className="no-results">沒有符合條件的機構</p>
                ) : (
                  facilities.map(facility => (
                    <div 
                      key={facility.id} 
                      className={`nearby-item ${selectedFacility?.id === facility.id ? 'selected' : ''}`}
                      onClick={() => handleFacilityClick(facility)}
                    >
                      <h4>{facility.name}</h4>
                      <div className="nearby-details">
                        <span className="nearby-type">{getTypeDisplayName(facility.type)}</span>
                        <span className="nearby-distance">{facility.distance} 公里</span>
                      </div>
                      <p className="nearby-address">{facility.address}</p>
                      <div className="nearby-services">
                        {facility.services.slice(0, 2).map((service, index) => (
                          <span key={index} className="service-tag">{service.name}</span>
                        ))}
                        {facility.services.length > 2 && (
                          <span className="service-tag">+{facility.services.length - 2}項</span>
                        )}
                      </div>
                      <Link to={`/facility/${facility.id}`} className="view-detail">查看詳情</Link>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="map-display">
              <LeafletMap 
                facilities={facilities}
                selectedFacility={selectedFacility}
                onFacilityClick={handleFacilityClick}
                userLocation={userLocation}
              />
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

// 根據機構種類代碼獲取顯示名稱
const getTypeDisplayName = (typeCode: string): string => {
  const typeMap: {[key: string]: string} = {
    '1': '居家式服務',
    'A1': '老人養護中心',
    'A3': '護理之家',
    'B1': '居家護理所',
    'B2': '醫院或診所',
    'BF': '社區發展協會',
  };
  
  return typeMap[typeCode] || typeCode;
};

export default MapSearch; 