//////////// SECTION // imports (if needed)
// import 'regenerator-runtime/runtime';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import axios from 'axios';

//////////// SECTION // query selectors
/// SUB SECTION // icons
const groupIcon = '../assets/img/icons/Group.svg';
const clockIcon = '../assets/img/icons/clock.svg';
const bookmarkIcon = '../assets/img/icons/bookmark.svg';
/// SUB SECTION //blogs
const cardsContainer = document.querySelector('#cards-container');
const searchBar = document.querySelector('.search');
const authorDropdown = document.querySelector('#author-dropdown');
const groupDropdown = document.querySelector('#group-dropdown');
const orderDropdown = document.querySelector('#order-dropdown');
const searchInputEl = searchBar.querySelector('#search-input');
const deleteSearchFilterBtn = searchBar.querySelector('.delete-search-filter');
const blogCoverFallbackImg = '../assets/img/blogCoverFallBack.png';
const blogAuthorFallbackImg = '../assets/img/blogAuthorFallback.png';
/// SUB SECTION //slider
const sliderContainer = document.querySelector('.slider__container');
const sliderBanner = sliderContainer.querySelector('.slider__banner');
const sliderBullets = sliderContainer.querySelector(
  '.slider__carousel__bullets'
);
const sliderArrowLeft = sliderContainer.querySelector(
  '.slider__carousel__arrow--left'
);
const sliderArrowRight = sliderContainer.querySelector(
  '.slider__carousel__arrow--right'
);
//to choose the bullets after creating them
let bullets;

//////////// SECTION // variables
const BLOGS_PER_PAGE = 12;

const API_URLS = {
  BLOGS: 'https://api.sokanacademy.com/api/blogs',
  SLIDES: 'https://api.sokanacademy.com/api/announcements/blog-index-banner',
};

/// SUB SECTION // blogs
const filterDropdowns = [authorDropdown, groupDropdown, orderDropdown];
let dropdownsOriginalText = {
  'author-dropdown': 'نویسنده',
  'group-dropdown': 'دسته‌بندی',
  'order-dropdown': 'مرتب‌سازی',
};
let blogs = [];
let searchCheck = false;
let networkError = false;
const params = {
  per_page: BLOGS_PER_PAGE,
};
/// SUB SECTION //slider
const SCREEN_BREAKPOINTS = {
  SMALL: 576,
  MEDIUM: 992,
};
let slides = [];
let gotToSlideNo = 0;
let maxSlide = 0;
let currCoverSize;

//////////// SECTION //helper functions
/// SUB SECTION //cards
const resetDropdown = function (dropdown) {
  const deleteBtn = dropdown.querySelector('.delete-dropdown-filter');
  deleteBtn.style.display = 'none';
  removeSelected(dropdown);
  setDropdownText(dropdown, dropdownsOriginalText[dropdown.id]);
  dropdown.dataset.value = '';
  if (dropdown.id === 'author-dropdown') {
    delete params.author;
  } else if (dropdown.id === 'group-dropdown') {
    delete params.category;
  } else if (dropdown.id === 'order-dropdown') {
    delete params.latest;
    delete params.oldest;
    delete params.popular;
  }
};
const resetSearchInput = function () {
  delete params.q;
  searchInputEl.value = '';
  deleteSearchFilterBtn.style.display = 'none';
  searchInputEl.style.paddingRight = '12px';
};
// blogs error
const renderErrorMessage = function (message, danger) {
  cardsContainer.innerHTML = `<p class="w-100 text-center  ${danger ? 'text-danger vertical-spacing' : 'text-gray-dark'}">${message}</p>`;
};
//delete filters btn
const deleteFiltersBtn = function () {
  return `
  <button class="btn delete-filters border-0 d-flex vertical-spacing justify-content-center">
  <img src="../assets/img/icons/close-light.svg" alt="Delete" class="order-1 icon-md ms-2 align-self-center" />
  <span class="order-2">بازنشانی فیلترها</span>
</button>
  `;
};
//create card html element
const createCard = function (blogData) {
  return `
       <div class="col">
    <div class="card">
      <img src="${String(blogData.cover_path ? blogData.cover_path : blogCoverFallbackImg)}" alt="${String(blogData.title)}" class="card-img-top" />
      <div class="card-body d-flex flex-column align-items-start justify-content-between">
        <div class="card-text d-flex flex-column">
          <p class="card-title lh-lg t2">${String(blogData.title)}</p>
          <div class="card-text--avatar">
            <img src="${
              !blogData.author.avatar
                ? blogAuthorFallbackImg
                : blogData.author.avatar
            }" alt="${String(blogData.author.full_name)} profile picture" class="icon-md"/>
            <div class="t4 lh-base" >${String(blogData.author.full_name)}</div>
          </div>
        </div>
        <div class="card-body--metadata">
          <div class="meta-text">
            <div class="first-meta">
              <img src="${groupIcon}" alt="Group icon" class="icon-md" />
              <div class="sub1 meta-text--text" >${String(blogData.category_name)}</div>
            </div>
            <div class="second-meta">
              <img src="${clockIcon}" alt="Time" class="icon-md" />
              <div class="sub1 meta-text--text">${String(blogData.duration) + ' دقیقه'}</div>
            </div>
          </div>
          <img src="${bookmarkIcon}" alt="Bookmark" class="meta-bookmark-icon icon-lg" />
        </div>
      </div>
    </div>
  </div>
    `;
};

/// SUB SECTION //slider
//slider show
const displaySlider = function (show) {
  if (show) sliderContainer.classList.remove('d-none');
};

//slider render functions
const createSlide = function (data) {
  return `<a class="slider__slide" href="${data.link} " target="_blank">
            <img src="${data.cover}" class="d-block w-100 slider__slide--img " alt="${data.alt}">
          </a>`;
};
//create bullets
const createBullet = function (index) {
  return ` <button class="slider__carousel__bullet" data-slide="${index}"></button>`;
};
// format the data
//choose the slider size base on screen width
const getCoverSize = function () {
  const screenWidth = window.innerWidth;
  if (screenWidth < SCREEN_BREAKPOINTS.SMALL) return 'phone';
  if (screenWidth < SCREEN_BREAKPOINTS.MEDIUM) return 'tablet';
  return 'desktop';
};
const formatSlideData = function (data) {
  const coverSize = getCoverSize();
  //general slide obj
  //- extract a short ver of the title
  //- use the appropriate cover size
  return {
    alt: String(data.desktop.title.split(' ').slice(0, -2).join(' ')),
    link: String(data.desktop.metas.link),
    cover: String(data[coverSize].cover),
  };
};

//////////// SECTION //data fetching functions

/// SUB SECTION //blogs
// get cards data from blog API and formating the data
const fetchCardsData = async function () {
  try {
    showSpinner();
    let { data } = await axios.get(API_URLS.BLOGS, { params });
    blogs = data.data;
  } catch (error) {
    // Network or data processing error
    networkError = true;
    renderErrorMessage(
      `<strong>خطا در ارتباط با سرور!</strong> لطفا اتصال اینترنت خود را چک کنید`,
      true
    );
    console.error(`Failed to fetch data from blog url: ${error.message}`);
  }
};

/// SUB SECTION //slider
//slides
const fetchSlidesData = async function () {
  try {
    let { data } = await axios.get(API_URLS.SLIDES);
    data = Object.values(data.data);
    return data.map(formatSlideData);
  } catch (error) {
    //network error
    console.error(
      `Failed to fetch slides data: ${error.message}\n tip: turn off your VPN`
    );
    display(false);
  }
};

//////////// SECTION //rendering functions
/// SUB SECTION //blogs
// create cards
const renderCards = async function () {
  try {
    await fetchCardsData();
    if (networkError) return;
    if (!blogs || blogs.length === 0) {
      handleEmptyFilterRes();
      return;
    }
    cardsContainer.innerHTML = '';
    blogs.forEach((blog) => {
      cardsContainer.insertAdjacentHTML('beforeend', createCard(blog));
    });
  } catch (error) {
    console.error(error);
  }
};
//spinner
const spinnerMarkup = function () {
  return `<div class="d-flex justify-content-center wait-spinner vertical-spacing">
             <div class="spinner-border" role="status">
             <span class="visually-hidden">لطفا منتظر بمانید...</span>
             </div>
        </div>`;
};
const showSpinner = function () {
  cardsContainer.innerHTML = spinnerMarkup();
};

/// SUB SECTION //slides
// create slides
const renderSlides = async function (checkData) {
  //get the data
  const slidesData = await fetchSlidesData();
  if (slidesData.length === 0 || !slidesData)
    throw new Error('No slides found');
  //get the current slide size
  if (checkData) return slidesData;
  //check if cover size has changed
  //save the max size for bullets
  maxSlide = slidesData.length - 1;
  //render the slides
  sliderBanner.innerHTML = '';
  slidesData.forEach((slide) => {
    sliderBanner.insertAdjacentHTML('afterbegin', createSlide(slide));
  });
  //choose the images to work on
  slides = document.querySelectorAll('.slider__slide--img');
  return slidesData;
};
//create bullets
const renderBullets = function () {
  slides.forEach((_, index) => {
    sliderBullets.insertAdjacentHTML('beforeend', createBullet(index));
  });
  bullets = sliderBullets.querySelectorAll('.slider__carousel__bullet');
};

//////////// SECTION //event handlers
const handleEmptyFilterRes = function () {
  renderErrorMessage('وبلاگی وجود ندارد');
  cardsContainer.insertAdjacentHTML('beforeend', deleteFiltersBtn());
  const deleteBtn = document.querySelector('.delete-filters');
  deleteBtn.addEventListener('click', async (ev) => {
    ev.preventDefault();
    for (const [param, _] of Object.entries(params)) {
      if (param !== 'per_page') {
        delete params[param];
      }
    }
    //reset search bar
    if (searchInputEl.value !== '') resetSearchInput();
    //reset dropdowns
    filterDropdowns.forEach((dropdown) => {
      if (dropdown.value !== '') resetDropdown(dropdown);
    });

    //render cards again
    await renderCards();
  });
};
/// SUB SECTION //filters
const removeSelected = function (dropdown) {
  dropdown
    .querySelectorAll('.dropdown-item')
    .forEach((item) => item.classList.remove('selected'));
};
const setDropdownText = function (dropdown, text) {
  const buttonText = dropdown.querySelector('#button-text');
  buttonText.textContent = text;
};
const handleFilter = async function (ev, dropdown) {
  ev.preventDefault();
  removeSelected(dropdown);
  //to set the selected items text as the dropdowns text
  setDropdownText(dropdown, ev.target.textContent);
  //set the dropdown menu items data to Its parent dropdown
  const { dataset } = ev.currentTarget;
  dropdown.dataset.value = Object.values(dataset)[0];
  //apply the filter
  await applyFilters();
};
const deleteSelectedFilterSign = function (dropdownBtn, dropdown) {
  const deleteBtn = dropdownBtn.querySelector('.delete-dropdown-filter');
  const dropdownMenu = dropdown.querySelector('#dropdown-menu');
  deleteBtn.style.display = 'block';
  deleteBtn.addEventListener('click', async function (ev) {
    ev.preventDefault();
    if (dropdownBtn.classList.contains('show'))
      dropdownBtn.classList.remove('show');
    if (dropdownMenu) dropdownMenu.classList.remove('show');

    resetDropdown(dropdown);

    //apply the filter
    await applyFilters();
  });
};

const activateFilter = function (dropdown) {
  const dropdownBtn = dropdown.querySelector('#dropdown-btn');
  dropdown
    .querySelector('#dropdown-menu')
    .querySelectorAll('.dropdown-item')
    .forEach((item) => {
      item.addEventListener('click', async (ev) => {
        await handleFilter(ev, dropdown);
        item.classList.add('selected');
        deleteSelectedFilterSign(dropdownBtn, dropdown);
      });
    });
};
const activateFilters = function () {
  filterDropdowns.forEach((dropdown) => activateFilter(dropdown));
};

const applyFilters = async function () {
  if (groupDropdown.dataset.value !== '') {
    params['category'] = groupDropdown.dataset.value.toLowerCase();
  }

  if (authorDropdown.dataset.value !== '') {
    params['author'] = authorDropdown.dataset.value.toLowerCase();
  }

  if (orderDropdown.dataset.value !== '') {
    delete params.latest;
    delete params.oldest;
    delete params.popular;
    params[String(orderDropdown.dataset.value.toLowerCase())] = 1;
    // params[]
  }

  await renderCards();
};

/// SUB SECTION //search
//get the search word
const getQuery = function () {
  return searchBar.querySelector('.form-control').value;
};
const handleSearch = async function (ev) {
  ev.preventDefault();
  let query = getQuery();
  if (!query || query.length === 0) {
    delete params.q;
    await renderCards();
    return;
  }
  params.q = query.toLowerCase();
  searchCheck = true;
  await renderCards();
};
//close btn
const deleteSearchBtn = function () {
  function displayDeleteSearchBtn() {
    if (searchInputEl.value.trim()) {
      deleteSearchFilterBtn.style.display = 'block';
      searchInputEl.style.paddingRight = '2rem';
    } else {
      deleteSearchFilterBtn.style.display = 'none';
      searchInputEl.style.paddingRight = '12px';
    }
  }

  searchInputEl.addEventListener('input', displayDeleteSearchBtn);
  deleteSearchFilterBtn.addEventListener('click', async (ev) => {
    ev.preventDefault();
    resetSearchInput();
    await renderCards();
  });

  //prefilled
  displayDeleteSearchBtn();
};
//search
const searchCards = async function () {
  await renderCards(API_URLS);
  deleteSearchBtn();
  activateFilters();
  searchBar.addEventListener('submit', handleSearch);
};

/// SUB SECTION // slides functions

const activeBullets = function () {
  sliderBullets.addEventListener('click', function (e) {
    e.preventDefault();
    if (e.target.classList.contains('slider__carousel__bullet')) {
      const slideNo = e.target.dataset.slide;
      if (gotToSlideNo === slideNo) return;
      goToSlide(slideNo, false);
    }
  });
};
const setActiveBullet = function (slide) {
  //deactivate all bullets
  bullets.forEach((bullet) => {
    bullet.classList.remove('slider__carousel__bullet--active');
  });
  //active the chosen bullet
  bullets.forEach((bullet) => {
    if (Number(bullet.dataset.slide) === Number(slide)) {
      bullet.classList.add('slider__carousel__bullet--active');
    }
  });
};

const goToSlide = function (slideNo, init) {
  slides.forEach((slide, index) => {
    slide.style.transition = init ? '0s' : '0.5s';
    slide.style.transform = `translateX(${100 * (slideNo - index)}%)`;
  });
  setActiveBullet(slideNo);
};
const move = function (ev, move) {
  ev.preventDefault();
  //index of next slide
  if (move === 'next') {
    gotToSlideNo++;
  }
  //index of prev slide
  if (move === 'prev') {
    gotToSlideNo--;
  }
  if (gotToSlideNo > maxSlide) {
    gotToSlideNo = 0;
  } else if (gotToSlideNo < 0) {
    gotToSlideNo = maxSlide;
  }

  goToSlide(gotToSlideNo, false);
};
const setBannerHeight = function () {
  //chose one on the slides and set the height od banner to it
  const img = slides[0];

  const updateBannerHeight = () => {
    sliderBanner.style.height = `${img.offsetHeight}px`;
  };

  if (img.complete) {
    updateBannerHeight();
  }
  img.onload = updateBannerHeight;
};
const activateArrows = function () {
  sliderArrowLeft.addEventListener('click', (ev) => move(ev, 'next'));
  sliderArrowRight.addEventListener('click', (ev) => move(ev, 'prev'));
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowRight') move(ev, 'prev');
    ev.key === 'ArrowLeft' && move(ev, 'next');
  });
};
// Function to update slider appearance and functionality
const updateSliderAppearance = function () {
  setBannerHeight();
  setActiveBullet(gotToSlideNo);
  goToSlide(gotToSlideNo, true);
};

// Function to update the slider on resize
const updateSlider = async (lastCoverSize) => {
  const newCoverSize = getCoverSize();
  // Only re-render and possibly fetch data if the cover size has changed
  if (lastCoverSize !== newCoverSize) {
    currCoverSize = newCoverSize;
    await renderSlides();
  }
  updateSliderAppearance();
};

// Slider initialization function
const slider = async function () {
  await renderSlides();
  renderBullets();
  activeBullets();
  activateArrows();
  updateSliderAppearance();
  displaySlider(true);
  return getCoverSize();
};

// Initializing
async function init() {
  try {
    await searchCards();
    currCoverSize = await slider();

    // Resize the slides
    window.addEventListener('resize', () => updateSlider(currCoverSize));
  } catch (error) {
    console.error(`Initialization failed: ${error.message}`);
  }
}

document.addEventListener('DOMContentLoaded', init);
