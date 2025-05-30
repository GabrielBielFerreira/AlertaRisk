import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import './mapa.css';
import ForumFilter from '../../components/Forum/ForumFilter';
import ForumPost from '../../components/Forum/ForumPost';
import MapLegend from '../../components/Map/MapLegend';
import { RECIFE_LAT, RECIFE_LON, bairrosRecife, coordenadasBairros, fetchWeather } from '../Service/api';

const formatWeatherCondition = (condition) => {
  const conditionsMap = {
    'clear sky': 'Céu Limpo',
    'few clouds': 'Poucas Nuvens',
    'scattered clouds': 'Nuvens Dispersas',
    'broken clouds': 'Nuvens Parcialmente Cobertas',
    'overcast clouds': 'Céu Nublado',
    'light rain': 'Chuva Fraca',
    'moderate rain': 'Chuva Moderada',
    'heavy intensity rain': 'Chuva Intensa',
    'very heavy rain': 'Chuva Muito Intensa',
    'extreme rain': 'Chuva Extrema',
    'light intensity shower rain': 'Chuva Fraca com Pancadas',
    'shower rain': 'Chuva com Pancadas',
    'heavy intensity shower rain': 'Chuva Intensa com Pancadas',
    'thunderstorm': 'Tempestade',
    'thunderstorm with light rain': 'Tempestade com Chuva Fraca',
    'thunderstorm with heavy rain': 'Tempestade com Chuva Intensa',
  };
  return conditionsMap[condition?.toLowerCase()] || condition || 'N/A';
};

const postMarkerIcon = L.icon({
  iconUrl: './Vector.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const CustomZoomControl = () => {
  const map = useMap();
  useEffect(() => {
    if (!map) {
      console.error('Mapa não inicializado no CustomZoomControl');
      return;
    }
    const zoomControl = L.control.zoom({ position: 'topleft' });
    zoomControl.addTo(map);
    return () => zoomControl.remove();
  }, [map]);
  return null;
};

const WeatherData = ({ onWeatherDataFetched }) => {
  const map = useMap();
  useEffect(() => {
    const fetchWeatherForBairros = async () => {
      const weatherData = {};
      for (const bairro of bairrosRecife) {
        const coords = coordenadasBairros[bairro];
        if (coords) {
          try {
            const data = await fetchWeather(coords.lat, coords.lon);
            const rain = data.rain && data.rain['1h'] ? data.rain['1h'] : 0;
            weatherData[bairro] = { ...data, rain };
          } catch (error) {
            console.error(`Erro ao buscar previsão do tempo para ${bairro}:`, error);
            weatherData[bairro] = { rain: 0 };
          }
        } else {
          console.warn(`Coordenadas não encontradas para ${bairro}`);
          weatherData[bairro] = { rain: 0 };
        }
      }
      onWeatherDataFetched(weatherData);
    };
    fetchWeatherForBairros();
  }, [map, onWeatherDataFetched]);
  return null;
};

const Mapa = () => {
  const [category, setCategory] = useState('');
  const [order, setOrder] = useState('recent');
  const [bairrosWeather, setBairrosWeather] = useState({});
  const [isForumExpanded, setIsForumExpanded] = useState(false);
  const [mapMode, setMapMode] = useState('weather');
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: 'Alagamento grave',
      description: 'Rua Exemplo, 123',
      author: 'Colaborador',
      bairro: 'Boa Viagem',
      category: 'alagamento',
      time: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      imageUrl: 'https://via.placeholder.com/50',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50&q=80',
      lat: -8.1135,
      lon: -34.8912,
    },
    {
      id: 2,
      title: 'Problema na via',
      description: 'Avenida Teste, 456',
      author: 'Usuario2',
      bairro: 'Madalena',
      category: 'outros',
      time: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      imageUrl: 'https://via.placeholder.com/50',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50&q=80',
      lat: -8.0578,
      lon: -34.9045,
    },
  ]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // Track the pending action (like/dislike)

  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('userId');

  useEffect(() => {
    const newPost = localStorage.getItem('newPost');
    if (newPost) {
      const parsedPost = JSON.parse(newPost);
      setPosts((prevPosts) => [...prevPosts, parsedPost]);
      localStorage.removeItem('newPost');
    }
  }, []);

  const fetchPostsFromBackend = async () => {
    try {
      let filteredPosts = [...posts];
      if (category) {
        filteredPosts = filteredPosts.filter((post) => post.category === category);
      }
      if (order === 'recent') {
        filteredPosts.sort((a, b) => new Date(b.time) - new Date(a.time));
      } else if (order === 'oldest') {
        filteredPosts.sort((a, b) => new Date(a.time) - new Date(b.time));
      }
      setPosts(filteredPosts);
      setMapMode('posts');
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      setPosts([]);
      setMapMode('weather');
    }
  };

  const handleNewPostClick = () => {
    if (!isAuthenticated) {
      alert('Faça login para criar uma postagem!');
      navigate('/login');
      return;
    }
    navigate('/mapa/nova-postagem');
  };

  const handleLike = (postId) => {
    if (!isAuthenticated) {
      alert('Faça login para curtir!');
      navigate('/login');
      return;
    }
    const post = posts.find((p) => p.id === postId);
    setSelectedPost(post);
    setPendingAction('like'); // Set the pending action to 'like'
    setShowConfirmation(true); // Show the confirmation popup
  };

  const handleDislike = (postId) => {
    if (!isAuthenticated) {
      alert('Faça login para descurtir!');
      navigate('/login');
      return;
    }
    const post = posts.find((p) => p.id === postId);
    setSelectedPost(post);
    setPendingAction('dislike'); // Set the pending action to 'dislike'
    setShowConfirmation(true); // Show the confirmation popup
  };

  const handleConfirmation = async (confirmed) => {
    if (!confirmed) {
      // If the user cancels, reset the state and close the popup
      setShowConfirmation(false);
      setSelectedPost(null);
      setPendingAction(null);
      return;
    }

    // If the user confirms, proceed with the like/dislike action
    const postId = selectedPost.id;
    const userId = localStorage.getItem('userId');

    try {
      if (pendingAction === 'like') {
        const response = await fetch(`/api/posts/${postId}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        if (response.ok) {
          setPosts((prevPosts) =>
            prevPosts.map((post) =>
              post.id === postId ? { ...post, likes: post.likes + 1 } : post
            )
          );
        }
      } else if (pendingAction === 'dislike') {
        const response = await fetch(`/api/posts/${postId}/dislike`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        if (response.ok) {
          setPosts((prevPosts) =>
            prevPosts.map((post) =>
              post.id === postId ? { ...post, dislikes: post.dislikes + 1 } : post
            )
          );
        }
      }
    } catch (error) {
      console.error(`Erro ao ${pendingAction === 'like' ? 'curtir' : 'descurtir'} o post:`, error);
    } finally {
      // Reset the state and close the popup
      setShowConfirmation(false);
      setSelectedPost(null);
      setPendingAction(null);
    }
  };

  const getColor = (intensity) => {
    if (intensity > 7.6) return '#ff4d4d';
    if (intensity >= 2.5) return '#ffaa33';
    return '#33cc33';
  };

  return (
    <div className="mapa-container">
      <aside className={`sidebar ${isForumExpanded ? 'expanded' : 'collapsed'}`}>
        {isForumExpanded ? (
          <>
            <div className="forum-header">
              <span>Relate um problema</span>
              <button
                className="toggle-forum-btn"
                onClick={() => setIsForumExpanded(false)}
              >
                <img
                  src="https://img.icons8.com/material-outlined/20/ffffff/chevron-left.png"
                  alt="Fechar Fórum"
                />
              </button>
            </div>
            <button className="new-post-btn" onClick={handleNewPostClick}>
              Nova postagem
            </button>
            <div className="forum-section">
              <h3 className="forum-title">Fórum da região</h3>
              <ForumFilter
                category={category}
                setCategory={setCategory}
                order={order}
                setOrder={setOrder}
                onFilter={fetchPostsFromBackend}
              />
              <div className="forum-posts-container">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <ForumPost
                      key={post.id}
                      post={post}
                      onLike={handleLike}
                      onDislike={handleDislike}
                    />
                  ))
                ) : (
                  <p className="no-posts">Nenhum post encontrado.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="forum-header">
            <button
              className="toggle-forum-btn"
              onClick={() => setIsForumExpanded(true)}
            >
              <img
                src="https://img.icons8.com/material-outlined/20/ffffff/chevron-right.png"
                alt="Abrir Fórum"
              />
            </button>
          </div>
        )}
      </aside>

      <section className="map-section">
        <MapContainer
          center={[RECIFE_LAT, RECIFE_LON]}
          zoom={12}
          className="map"
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <CustomZoomControl />
          <WeatherData onWeatherDataFetched={setBairrosWeather} />

          {mapMode === 'weather' ? (
            bairrosRecife.map((bairro) => {
              const coords = coordenadasBairros[bairro];
              const weather = bairrosWeather[bairro];
              const intensity = weather ? weather.rain || 0 : 0;
              if (!coords) return null;
              return (
                <Marker
                  key={bairro}
                  position={[coords.lat, coords.lon]}
                  icon={L.divIcon({
                    className: 'weather-marker',
                    html: `<div style="background-color: ${getColor(intensity)}; width: 16px; height: 16px; border-radius: 50%;"></div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8],
                  })}
                >
                  <Popup>
                    <div className="weather-info-popup">
                      <h4>Previsão do Tempo</h4>
                      <p><strong>Local:</strong> {bairro}</p>
                      <p><strong>Temperatura:</strong> {weather?.main?.temp || 'N/A'}°C</p>
                      <p>
                        <strong>Condição:</strong>{' '}
                        {weather?.weather?.[0] ? formatWeatherCondition(weather.weather[0].description) : 'N/A'}
                      </p>
                      <p className="rain-info">
                        <strong>Volume de Chuva (Última Hora):</strong>{' '}
                        {weather?.rain?.['1h'] || 0} mm
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })
          ) : (
            posts.map((post) => (
              <Marker
                key={post.id}
                position={[post.lat, post.lon]}
                icon={postMarkerIcon}
              >
                <Popup>
                  <div className="post-info-popup">
                    <h4>{post.title}</h4>
                    <p><strong>Descrição:</strong> {post.description}</p>
                    <div className="post-meta">
                      <img
                        src={post.avatarUrl || 'https://via.placeholder.com/20'}
                        alt="Avatar do usuário"
                        className="user-icon"
                      />
                      <span><strong>Autor:</strong> {post.author}</span>
                    </div>
                    <p><strong>Local:</strong> {post.bairro}</p>
                    <p><strong>Postagem:</strong> {new Date(post.time).toLocaleString()}</p>
                    <div className="post-actions">
                      <button onClick={() => handleLike(post.id)} className="action-btn">
                        <img src="/like.png" alt="Like" /> {post.likes}
                      </button>
                      <button onClick={() => handleDislike(post.id)} className="action-btn">
                        <img src="/deslike.png" alt="Dislike" /> {post.dislikes}
                      </button>
                    </div>
                    {!isAuthenticated && (
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.3125rem' }}>
                        Faça login para interagir!
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))
          )}
          <MapLegend />
        </MapContainer>

        {showConfirmation && selectedPost && (
          <div className="confirmation-modal">
            <div className="confirmation-content">
              <h3>Confirmação</h3>
              <p>Você confirma a informação da postagem "{selectedPost.title}"?</p>
              <div className="confirmation-buttons">
                <button className="confirm-btn" onClick={() => handleConfirmation(true)}>
                  Sim
                </button>
                <button className="deny-btn" onClick={() => handleConfirmation(false)}>
                  Não
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Mapa;