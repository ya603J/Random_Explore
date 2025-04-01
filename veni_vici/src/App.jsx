import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [banList, setBanList] = useState([])

  // Using the Art Institute of Chicago API
  const fetchRandomArtwork = async () => {
    setLoading(true)
    setError(null)
    try {
      // Basic query parameters - include additional fields
      let queryParams = 'limit=50&fields=id,title,artist_title,date_display,image_id,style_title,place_of_origin,medium_display&query[term][is_public_domain]=true'
      
      // Fetch a page of artworks
      const response = await fetch(`https://api.artic.edu/api/v1/artworks?${queryParams}`)
      const data = await response.json()
      
      if (data.data && data.data.length > 0) {
        // Filter out artworks with banned attributes
        const filteredArtworks = data.data.filter(artwork => {
          // Skip artworks without images
          if (!artwork.image_id) return false;
          
          // Skip artworks with banned artists
          if (artwork.artist_title && banList.includes(`artist:${artwork.artist_title}`)) {
            return false;
          }
          
          // Skip artworks with banned styles
          if (artwork.style_title && banList.includes(`style:${artwork.style_title}`)) {
            return false;
          }
          
          // Skip artworks with banned places of origin
          if (artwork.place_of_origin && banList.includes(`place:${artwork.place_of_origin}`)) {
            return false;
          }
          
          return true;
        });
        
        if (filteredArtworks.length === 0) {
          setError('No artworks found that match your criteria. Try removing some items from your ban list.');
          setLoading(false);
          return;
        }
        
        // Select a random artwork from the filtered results
        const randomIndex = Math.floor(Math.random() * filteredArtworks.length)
        const randomArtwork = filteredArtworks[randomIndex]
        
        const newItem = {
          id: randomArtwork.id,
          title: randomArtwork.title,
          artist: randomArtwork.artist_title,
          date: randomArtwork.date_display,
          style: randomArtwork.style_title,
          place: randomArtwork.place_of_origin,
          medium: randomArtwork.medium_display,
          imageUrl: `https://www.artic.edu/iiif/2/${randomArtwork.image_id}/full/843,/0/default.jpg`
        };
        
        setItem(newItem);
      } else {
        setError('No artworks found. Please try again.')
      }
    } catch (err) {
      setError('Error fetching artwork: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRandomArtwork()
  }, [])

  const handleBanToggle = (type, value) => {
    if (!value) return; // Don't add empty values
    
    const banValue = `${type}:${value}`;
    
    if (banList.includes(banValue)) {
      // Remove from ban list if already in it
      setBanList(banList.filter(item => item !== banValue))
    } else {
      // Add to ban list if not in it
      setBanList([...banList, banValue])
    }
  }

  // Get the display value without the type prefix
  const getDisplayValue = (banValue) => {
    const parts = banValue.split(':');
    return parts.length > 1 ? parts[1] : banValue;
  }
  
  // Get the type of a ban value (artist, style, place)
  const getBanType = (banValue) => {
    const parts = banValue.split(':');
    return parts.length > 1 ? parts[0] : 'unknown';
  }
  
  return (
    <div className="app-container">
      <div className="content-wrapper">
        <div className="main-content">
          <h1>Veni Vici!</h1>
          
          <p className="subtitle">Discover art from your wildest dreams!</p>
          
          {loading && <p>Loading...</p>}
          {error && <p className="error">{error}</p>}
          
          {item && !loading && (
            <div className="art-display">
              <img 
                src={item.imageUrl} 
                alt={item.title} 
                className="art-image"
              />
              <div className="art-info">
                <h2>{item.title}</h2>
                <p>
                  Artist: 
                  <span 
                    className={`clickable ${banList.includes(`artist:${item.artist}`) ? 'banned' : ''}`}
                    onClick={() => handleBanToggle('artist', item.artist)}
                  >
                    {item.artist || 'Unknown'}
                  </span>
                </p>
                <p>
                  Style: 
                  <span 
                    className={`clickable ${banList.includes(`style:${item.style}`) ? 'banned' : ''}`}
                    onClick={() => handleBanToggle('style', item.style)}
                  >
                    {item.style || 'Unknown'}
                  </span>
                </p>
                <p>
                  Place of Origin: 
                  <span 
                    className={`clickable ${banList.includes(`place:${item.place}`) ? 'banned' : ''}`}
                    onClick={() => handleBanToggle('place', item.place)}
                  >
                    {item.place || 'Unknown'}
                  </span>
                </p>
                <p>Date: {item.date}</p>
                <p>Medium: {item.medium}</p>
              </div>
            </div>
          )}
          
          <button 
            className="discover-button" 
            onClick={fetchRandomArtwork}
            disabled={loading}
          >
            🔍 Discover!
          </button>
        </div>
        
        <div className="ban-section">
          <h2>Ban List</h2>
          <p>Select an attribute in your listing to ban it</p>
          
          {banList.length === 0 ? (
            <p className="empty-ban-list">No items banned yet. Click on an attribute value to ban it.</p>
          ) : (
            <div className="banned-attributes">
              <ul>
                {banList.map((item, index) => (
                  <li key={index} onClick={() => handleBanToggle(getBanType(item), getDisplayValue(item))}>
                    <span className="ban-type">{getBanType(item)}</span>
                    {getDisplayValue(item)} 
                    <span className="remove-icon">×</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
