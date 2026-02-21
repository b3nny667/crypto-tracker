document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const cryptoDataEl = document.getElementById('crypto-data');
    const refreshBtn = document.getElementById('refresh');
    const searchInput = document.getElementById('search');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    // Global variables
    let cryptoData = [];
    let filteredData = [];
    
    // Fetch crypto data from CoinGecko API
    async function fetchCryptoData() {
        try {
            cryptoDataEl.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading cryptocurrency data...</div>`;
            
            const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false');
            const data = await response.json();
            
            cryptoData = data;
            filteredData = [...data];
            
            renderCryptoData();
            updateGlobalStats();
        } catch (error) {
            console.error('Error fetching crypto data:', error);
            cryptoDataEl.innerHTML = `<div class="loading error"><i class="fas fa-exclamation-circle"></i> Failed to load data. Please try again later.</div>`;
        }
    }
    
    // Render crypto data to the DOM
    function renderCryptoData() {
        if (filteredData.length === 0) {
            cryptoDataEl.innerHTML = `<div class="loading">No cryptocurrencies found matching your criteria.</div>`;
            return;
        }
        
        cryptoDataEl.innerHTML = '';
        
        filteredData.forEach(crypto => {
            const change24h = crypto.price_change_percentage_24h;
            const changeClass = change24h >= 0 ? 'positive' : 'negative';
            
            const cryptoItem = document.createElement('div');
            cryptoItem.className = 'crypto-item';
            cryptoItem.innerHTML = `
                <div class="rank">${crypto.market_cap_rank || '-'}</div>
                <div class="name">
                    <img src="${crypto.image}" alt="${crypto.name}">
                    ${crypto.name} <span class="symbol">${crypto.symbol.toUpperCase()}</span>
                </div>
                <div class="price">$${crypto.current_price.toLocaleString()}</div>
                <div class="change ${changeClass}">${change24h ? change24h.toFixed(2) + '%' : '-'}</div>
                <div class="market-cap">$${crypto.market_cap.toLocaleString()}</div>
            `;
            
            cryptoDataEl.appendChild(cryptoItem);
        });
    }
    
    // Update global statistics
    function updateGlobalStats() {
        if (cryptoData.length === 0) return;
        
        const totalMarketCap = cryptoData.reduce((sum, crypto) => sum + crypto.market_cap, 0);
        const totalVolume = cryptoData.reduce((sum, crypto) => sum + crypto.total_volume, 0);
        
        document.getElementById('total-market-cap').textContent = `$${(totalMarketCap / 1000000000).toFixed(2)}B`;
        document.getElementById('total-volume').textContent = `$${(totalVolume / 1000000000).toFixed(2)}B`;
        document.getElementById('active-cryptos').textContent = cryptoData.length;
    }
    
    // Filter crypto data based on search input
    function filterBySearch() {
        const searchTerm = searchInput.value.toLowerCase();
        
        filteredData = cryptoData.filter(crypto => 
            crypto.name.toLowerCase().includes(searchTerm) || 
            crypto.symbol.toLowerCase().includes(searchTerm)
        );
        
        renderCryptoData();
    }
    
    // Filter crypto data based on button selection
    function filterByButton(filter) {
        // Remove active class from all buttons
        filterBtns.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        event.target.classList.add('active');
        
        switch(filter) {
            case 'top10':
                filteredData = cryptoData.slice(0, 10);
                break;
            case 'gainers':
                filteredData = [...cryptoData]
                    .filter(crypto => crypto.price_change_percentage_24h > 0)
                    .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
                break;
            case 'losers':
                filteredData = [...cryptoData]
                    .filter(crypto => crypto.price_change_percentage_24h < 0)
                    .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
                break;
            default:
                filteredData = [...cryptoData];
        }
        
        renderCryptoData();
    }
    
    // Event listeners
    refreshBtn.addEventListener('click', fetchCryptoData);
    searchInput.addEventListener('input', filterBySearch);
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterByButton(btn.dataset.filter);
        });
    });
    
    // Initial data fetch
    fetchCryptoData();
    
    // Auto-refresh every 5 minutes
    setInterval(fetchCryptoData, 5 * 60 * 1000);
});