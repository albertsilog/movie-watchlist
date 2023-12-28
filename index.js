// DOM global variables
const searchField = document.getElementById("search-field")
const searchResults = document.getElementById("search-results")
const searchForm = document.getElementById("search-form")
const watchList = document.getElementById("watch-list")

// global variables
const APIKey = "793dbfcc" // individual key for https://www.omdbapi.com/
const APIKey2 = "3dce0b9&s"
const APIKey3 = "1db24459"
const APIKey4 = "16f80093"
let feedHtml = ''
let pageNum = 1
let searchPagesArray = [] // global array for fetched data of movie search results
// initiates global array for data of movies added in watchlist from local storage
!localStorage.getItem("watchlist") ? localStorage.setItem("watchlist", JSON.stringify([])) : ""
const watchlistArray = JSON.parse(localStorage.getItem("watchlist"))

if(watchList) {
    watchList.innerHTML = renderHtml(watchlistArray)
    pageNum = 1
} 

// search button submit event listener
searchForm ? searchForm.addEventListener("submit", handleSubmit) : ""


// click event listeners
document.addEventListener("click", e => {
    e.target.id === "prev" ? handleNavBtnsClick(e.target.id) 
    : e.target.id === "next" ? handleNavBtnsClick(e.target.id) 
    : e.target.dataset.add ? handleWatchlistBtnClick(e.target)
    : e.target.dataset.remove ? handleRemoveBtnClick(e.target)
    : ""
})

function handleSubmit(e) {
    e.preventDefault()
    fetchMovies(searchField.value)
}

function handleWatchlistBtnClick(targetEl) {
    targetEl.innerHTML = `<i class="fa-regular fa-circle-check"></i> Added to watchlist`
    targetEl.disabled = true
    targetEl.classList.add("disabled-btn")
    const targetObj = searchPagesArray.find(movie => movie.imdbID === targetEl.dataset.add)
    watchlistArray.unshift(targetObj)
    localStorage.setItem("watchlist", JSON.stringify(watchlistArray))
}

function handleRemoveBtnClick(targetEl) {
    const targetIndex = watchlistArray.findIndex(movie => movie.imdbID === targetEl.dataset.remove)
    watchlistArray.splice(targetIndex, 1)
    localStorage.setItem("watchlist", JSON.stringify(watchlistArray))
    watchlistArray.length%10 === 0 && watchlistArray.length/10 === (pageNum-1) ? pageNum-- : ""
    watchList.innerHTML = renderHtml(watchlistArray)
}

function handleNavBtnsClick(btn) {
    window.scrollTo(0, 0);
    btn === "prev" ? pageNum-- : pageNum++
    searchResults ? searchResults.innerHTML = renderHtml(searchPagesArray) : ""
    watchList ? watchList.innerHTML = renderHtml(watchlistArray) : ""
}

async function fetchMovies(searchString) {
    let imdbIdsArray = []   // temporary array of imdbIds of search results
    searchResults.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`
    const response = await fetch(`https://www.omdbapi.com/?apikey=${APIKey4}&s=${searchString}&type=movie&page=1`)
    const data = await response.json()
    if(data.Search) {
        imdbIdsArray = data.Search.map(movie => movie.imdbID)
        for(let i = 2; i < Math.ceil(data.totalResults/10)+1; i++) {
            const res = await fetch(`https://www.omdbapi.com/?apikey=${APIKey4}&s=${searchString}&type=movie&page=${i}`)
            const data = await res.json()
            imdbIdsArray.push(...data.Search.map(movie => movie.imdbID))
        }
        pageNum = 1 // resets page number for every search click
        generateMovieDetails(imdbIdsArray)
    } else {
        searchResults.innerHTML = `
            <h3 id="no-result">Unable to find what you’re looking for. Please try another search.</h3>
        `
    }
}

async function generateMovieDetails(idArray) {
    const fetches = idArray.map(id => fetch(`https://www.omdbapi.com/?apikey=${APIKey4}&i=${id}`))
    const responses = await Promise.all(fetches)
    const data = await Promise.all(responses.map(response => response.json()))
    searchPagesArray = data
    searchResults.innerHTML = renderHtml(searchPagesArray)
}

// generates html to results page
function renderHtml(moviesArray) {
    feedHtml = ``    // resets html string for each search, next page or previous page click
    for(let i = 0; i < 10; i++) {
        const movie = moviesArray[i + 10*(pageNum-1)]
        if(movie) {
            feedHtml += `
                <div class="movie-card">
                    <img 
                        class="movie-poster" 
                        src="${movie.Poster}" 
                        onerror="this.src='img/error-image.jpg'"
                        alt="image of movie poster"
                    />
                    <div class="movie-details">
                        <div class="movie-heading">
                            <h3 class="movie-title">${movie.Title}</h3>
                            <div class="rating-container">
                                <i class="fa-solid fa-star"></i>
                                <p class="movie-rating">${movie.imdbRating}</p>
                            </div>
                        </div>
                        <div class="movie-subheading">
                            <p class="movie-runtime">${movie.Runtime}</p>
                            <p class="movie-genre">${movie.Genre}</p>
                            ${toggleWatchlistBtn(movie.imdbID)}
                        </div>
                        <div class="movie-body">
                            <p class="movie-plot">${movie.Plot}</p>
                        </div>
                    </div>
                </div>
            `
        }
    }
    // generates html for buttons for navigating results
    // logic to determine whether previous or next buttons shows up
    if(moviesArray.length > 10) {
        if(pageNum === 1) {
            feedHtml += `
                <div id="btn-container">
                    <button id="next">Next</button>
                </div>
            `
        } else if(pageNum > 1 && pageNum < Math.ceil(moviesArray.length/10)) {
            feedHtml += `
                <div id="btn-container">
                    <button id="prev">Previous</button>
                    <button id="next">Next</button>
                </div>
            `
        } else {
            feedHtml += `
                <div id="btn-container">
                    <button id="prev">Previous</button>
                </div>
            `
        }
    } else if(moviesArray.length === 0) {
        feedHtml += `
            <div id="no-watchlist">
                <h3 id="empty-message">Your watchlist is looking a little empty...</h3>
                <a href="./index.html">
                    <i class="fa-solid fa-circle-plus"></i>
                    Let's add some movies!
                </a>
            </div>
        `
    }
    return feedHtml
}

// generates html which determines if the movie is already added to the watchlist or not
function toggleWatchlistBtn(id) {
    if(watchlistArray.some(movie => movie.imdbID === id) && searchResults) {
        return `
            <button 
                class="movie-add-watchlist disabled-btn" 
                disabled
            >
                <i class="fa-regular fa-circle-check"></i>
                Added to watchlist               
            </button>
        `
    } else if(searchResults) {
        return `
            <button 
                class="movie-add-watchlist" 
                data-add="${id}"
            >
                <i class="fa-solid fa-circle-plus"></i>
                Watchlist
            </button>
        `
    } else if(watchList) {
        return `
            <button 
                class="movie-remove-watchlist" 
                data-remove="${id}"
            >
                <i class="fa-solid fa-circle-minus"></i>
                Remove
            </button>
        `
    }
}