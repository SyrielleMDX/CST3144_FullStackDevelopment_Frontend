const NAME_PATTERN = /^[A-Za-z ]+$/; // letters only
const PHONE_PATTERN = /^[0-9]+$/; // digits only

function formatPrice(amount) {
    return 'Rs ' + Number(amount).toLocaleString('en-US');
}

const app = Vue.createApp({
    data() {
        return {
            // navigation
            view: 'home',
            menuOpen: false,

            // data from the server
            catalogue: [], // all lessons
            results: [], // lessons matching search/filter
            teachers: [],
            enrolment: {}, // for classes booked
            ratings: {},
            loading: true,
            error: '',
            requestId: 0,

            // explore controls
            search: '',
            searchTimer: null,
            sortBy: 'topic',
            sortDir: 'asc',
            category: 'all',
            ageGroup: 'all',
            teacherFilter: '',
            categories: CATEGORIES,
            ageGroups: AGE_GROUPS,
            categoryStyle: CATEGORY_STYLE,
            teacherColours: ['#FFD45C', '#FF8FA6', '#8FD6A8', '#9CCBFF', '#FFA66B', '#C9B6FF'],

            // teachers page
            selectedTeacherId: null,
            teacherLessons: [],

            // cart + checkout
            cart: [], 
            name: '',
            phone: '',
            submitting: false,
            orderError: '',
            confirmation: null,
            confetti: [],

            // account
            user: null,
            authMode: 'login',
            authReturn: null,
            authError: '',
            authBusy: false,
            showPassword: false,
            authForm: { role: 'parent', name: '', email: '', phone: '', age: '', password: '' },
            profileForm: { name: '', phone: '', age: '' },
            profileMsg: '',
            profileError: '',
            profileBusy: false,
            myOrders: [],
            myReviews: {},
            historyLoading: false,

            // class window
            previewLesson: null,
            modalTab: 'about',
            reviews: [],
            reviewsLoading: false,
            reviewForm: { rating: 0, comment: '' },
            reviewHover: 0,
            reviewBusy: false,
            reviewError: '',
            reviewSaved: false,

            // notifications
            toast: null,
            toastTimer: null,

            // newsletter
            newsletterEmail: '',
            newsletterError: '',

            // for home page
            heroTiles: [
                { icon: 'fa-robot', colour: '#8FD6A8', sticker: 'flower' },
                { icon: 'fa-palette', colour: '#FF8FA6', sticker: 'burst' },
                { icon: 'fa-drum', colour: '#FFA66B', sticker: 'flower' },
                { icon: 'fa-flask', colour: '#FFD45C', sticker: 'burst' },
                { icon: 'fa-chess-knight', colour: '#9CCBFF', sticker: 'flower' }
            ],

            // home page content
            features: [
                { cls: 'green', icon: 'fa-wand-magic-sparkles', title: 'Try before you book', text: 'Every class has its own mini activity, from coding puzzles to chess mates, so you know what you are signing up for.' },
                { cls: 'pink', icon: 'fa-children', title: 'Made for ages 6 to 18', text: 'Playful classes for little ones and serious skills for teens, all filtered by age so you only see what fits.' },
                { cls: 'orange', icon: 'fa-star', title: 'Real reviews', text: 'Only people who booked a class can rate it, so the stars and comments you read are honest.' }
            ],
            parentPoints: [
                { icon: 'fa-calendar-check', title: 'Simple booking', text: 'Compare spaces, prices and places, then check out in one go.' },
                { icon: 'fa-shield-heart', title: 'Trusted teachers', text: 'Meet every teacher and read what other families say.' },
                { icon: 'fa-clock-rotate-left', title: 'Everything in one place', text: 'Your booking history and reviews live in your profile.' }
            ]
        }
    },

    computed: Object.assign({}, activityComputed, {
        // cart
        cartCount() { 
          return this.cart.reduce((sum, item) => sum + item.quantity, 0); 
        },
        cartTotal() { 
          return this.cart.reduce((sum, item) => sum + item.quantity * item.lesson.price, 0); 
        },
        nameValid() { 
          return NAME_PATTERN.test(this.name); 
        },
        phoneValid() { 
          return PHONE_PATTERN.test(this.phone); 
        },
        canCheckout() { 
          return this.cartCount > 0 && this.nameValid && this.phoneValid; 
        },

        // explore page 
        sortedResults() {
            const list = this.results.filter(lesson => {
                const matchesCategory = this.category === 'all' || categoryOf(lesson.topic) === this.category;
                return matchesCategory && this.matchesAge(lesson);
            });

            list.sort((a, b) => {
                let result;

                if (this.sortBy === 'price') {
                    result = a.price - b.price;
                } 
                
                else if (this.sortBy === 'space') {
                    result = this.availableSpaces(a) - this.availableSpaces(b);
                } 
                
                else {
                    result = String(a[this.sortBy]).localeCompare(
                        String(b[this.sortBy])
                    );
                }

                if (result === 0) {
                    return a.title.localeCompare(b.title);
                }

                if (this.sortDir === 'desc') {
                    return -result;
                }

                return result;
            });

            return list;
        },

        directionLabels() {
            if (this.sortBy === 'price') 
                return ['Low to high', 'High to low'];
            if (this.sortBy === 'space') 
                return ['Fewest first', 'Most first'];
            return ['A to Z', 'Z to A'];
        },
        hasFilters() {
            return this.search !== '' || this.category !== 'all' || this.teacherFilter !== '' || this.ageGroup !== 'all';
        },
        showGrid() {
            return this.view === 'home'
                || (this.view === 'explore' && !this.loading && !this.error && this.sortedResults.length > 0)
                || (this.view === 'teachers' && !!this.selectedTeacher)
                || (this.view === 'quiz' && this.quizMode === 'results');
        },
        gridLessons() {
            if (this.view === 'explore') 
                return this.sortedResults;
            if (this.view === 'teachers') 
                return this.teacherLessons;
            if (this.view === 'quiz') 
                return this.picks.map(p => p.lesson);
            if (this.view === 'home') 
                return this.showPicks ? this.picks.map(p => p.lesson) : this.popularLessons;
            return [];
        },

        // teachers
        featuredTeachers() { 
            return this.teachers.slice(0, 3); 
        },
        selectedTeacher() { 
            return this.teachers.find(t => t._id === this.selectedTeacherId) || null; 
        },

        // profile
        placesBooked() { 
            return this.myOrders.reduce((s, o) => s + o.items.reduce((n, i) => n + i.quantity, 0), 0); 
        },
        reviewCount() { 
            return Object.keys(this.myReviews).length; 
        }
    }),

    watch: {
        teacherFilter() { 
            this.loadResults(); 
        },
        cartCount(count) {
            if (count === 0 && this.view === 'cart' && !this.confirmation) 
                this.go('explore');
        }
    },

    created() {
        this.loadTeachers();
        this.loadCatalogue();
        this.loadResults();
        this.loadRatings();
        WonderlyAPI.getCurrentUser()
            .then(user => { 
                if (user) 
                    this.setUser(user); 
            })
            .catch(error => {
                console.error('Failed to get current user: ', error)
            });
    },

    mounted() {
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && this.previewLesson) 
                this.closePreview();
        });
    },

    methods: Object.assign({}, activityMethods, {
        // navigation
        go(id) {
            if (this.view === 'tryit' && id !== 'tryit') 
                this.startActivity();   // stops timers and resets the game
            this.view = id;
            this.menuOpen = false;
            this.previewLesson = null;
            if (id !== 'cart') 
                this.confirmation = null;
            if (id !== 'teachers') 
                this.selectedTeacherId = null;
            if (id === 'quiz') 
                this.quizMode = this.quizResult ? 'results' : 'intro';
            if (id === 'history' || id === 'profile') {
                if (!this.user) {
                    this.authMode = 'login';
                    this.authReturn = id;
                    this.view = 'auth';
                } else {
                    this.loadMyOrders();
                }
            }
            window.scrollTo({ top: 0 });
        },
        toggleCart() {
            if (this.view === 'cart') 
                this.go('explore');
            else if (this.cartCount > 0) 
                this.go('cart');
        },
        matchesAge(lesson) {
            if (this.ageGroup === 'all') 
                return true;
            const group = AGE_GROUPS.find(g => g.id === this.ageGroup);
            return lesson.ageMin <= group.max && lesson.ageMax >= group.min;
        },

        // loading data
        loadTeachers() {
            return WonderlyAPI.getTeachers()
                .then(t => { this.teachers = t; })
                .catch(err => { this.error = err.message; });
        },
        loadCatalogue() {
            return WonderlyAPI.getLessons()
                .then(lessons => { 
                    this.catalogue = lessons; 
                    return this.loadEnrolment(lessons); 
                })
                .catch(err => { this.error = err.message; });
        },
        loadEnrolment(lessons) {
            const requests = lessons.map(lesson => {
                return WonderlyAPI.getEnrolment(lesson._id).then(count => {
                    return [lesson._id, count];
                });
            });

            return Promise.all(requests)
                .then(results => {
                    this.enrolment = Object.fromEntries(results);
                })
                .catch(error => {
                    console.error('Failed to load enrolment counts:', error);
                });
        },
        loadRatings() {
            return WonderlyAPI.getReviewSummaries().then(s => { this.ratings = s; }).catch(() => {});
        },
        loadResults() {
            const id = ++this.requestId; // ignore answers after new search
            this.loading = true;
            this.error = '';
            return WonderlyAPI.getLessons({ search: this.search, teacherId: this.teacherFilter })
                .then(lessons => { if (id === this.requestId) this.results = lessons; })
                .catch(err => { if (id === this.requestId) this.error = 'We could not load the lessons. ' + err.message; })
                .finally(() => { if (id === this.requestId) this.loading = false; });
        },
        clearFilters() {
            this.search = '';
            this.category = 'all';
            this.teacherFilter = '';
            this.ageGroup = 'all';
        },

        // helpers
        teacherName(id) {
            const teacher = this.teachers.find(t => t._id === id);
            return teacher ? teacher.firstName + ' ' + teacher.lastName : '';
        },     
        lessonCountFor(teacherId) { 
          return this.catalogue.filter(l => l.teacherId === teacherId).length; 
        },  
        catId(topic) { 
          return categoryOf(topic); 
        },
        catClass(topic) { 
          return 'cat-' + categoryOf(topic); 
        },
        formatDate(iso) { 
          return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); 
        },
        shortRef(id) { 
          return '#' + String(id).slice(-6).toUpperCase(); 
        },
        imageUrl(file) {
            return API_BASE_URL + '/images/' + file;
        },

        // star icons for rating
        starClass(rating, n) {
            const diff = rating - n + 1;
            if (diff >= 1) return 'fa-solid fa-star';
            if (diff >= 0.5) return 'fa-solid fa-star-half-stroke';
            return 'fa-regular fa-star';
        },
        cartQty(lessonId) {
            const item = this.cart.find(i => i.lesson._id === lessonId);
            return item ? item.quantity : 0;
        },

        // spaces displayed to users
        availableSpaces(lesson) { 
            return Math.max(0, lesson.space - this.cartQty(lesson._id)); 
        },
        hasBought(lessonId) { 
            return this.myOrders.some(o => o.items.some(i => i.lessonId === lessonId)); 
        },

        // cart
        addToCart(lesson) {
            if (this.availableSpaces(lesson) <= 0) 
                return;
            const item = this.cart.find(i => i.lesson._id === lesson._id);
            if (item) 
                item.quantity++;
            else 
                this.cart.push({ lesson: Object.assign({}, lesson), quantity: 1 });
        },
        removeOne(lessonId) {
            const index = this.cart.findIndex(i => i.lesson._id === lessonId);
            if (index === -1) 
                return;
            if (this.cart[index].quantity > 1) 
                this.cart[index].quantity--;
            else this.cart.splice(index, 1);
        },
        removeLine(lessonId) {
            this.cart = this.cart.filter(i => i.lesson._id !== lessonId);
        },

        // checkout function 
        submitOrder() {
            if (!this.canCheckout || this.submitting) 
                return;
            this.submitting = true;
            this.orderError = '';
            const summary = this.cart.map(i => ({ title: i.lesson.title, quantity: i.quantity, total: i.quantity * i.lesson.price }));
            const payload = {
                name: this.name,
                phone: this.phone,
                items: this.cart.map(i => ({ lessonId: i.lesson._id, quantity: i.quantity }))
            };

            WonderlyAPI.postOrder(payload)
                .then(order => {
                    // when order saved, update spaces of booked lesson
                    const updates = order.items.map(item =>
                        WonderlyAPI.updateLessonSpace(item.lessonId, order.currentSpaces[item.lessonId] - item.quantity));
                    return Promise.all(updates)
                        .catch(err => console.error('Could not update the lesson spaces:', err))
                        .then(() => order);
                })
                .then(order => {
                    this.confirmation = { reference: this.shortRef(order._id), name: order.name, items: summary, total: order.total, loggedIn: !!this.user };
                    this.confetti = this.makeConfetti();
                    this.cart = [];
                    this.name = this.user ? this.user.name : '';
                    this.phone = this.user ? (this.user.phone || '') : '';
                    this.loadCatalogue();
                    this.loadResults();
                    if (this.user) this.loadMyOrders();
                })
                .catch(err => { this.orderError = err.message; })
                .finally(() => { this.submitting = false; });
        },
        makeConfetti() {
            const colours = ['#FFD45C', '#3F2620', '#FF8FA6', '#8FD6A8', '#9CCBFF', '#FF7F3F'];
            return Array.from({ length: 36 }, (_, i) => ({
                left: Math.random() * 100 + '%',
                background: colours[i % colours.length],
                animationDelay: Math.random() * 0.8 + 's',
                animationDuration: 2.2 + Math.random() * 1.8 + 's'
            }));
        },

        loadModalReviews() {
            const lesson = this.previewLesson;
            if (!lesson) 
                return Promise.resolve();
            this.reviewsLoading = true;
            return WonderlyAPI.getReviews(lesson._id)
                .then(list => {
                    if (!this.previewLesson || this.previewLesson._id !== lesson._id) 
                        return;
                    this.reviews = list;
                    if (this.myReviewHere) 
                        this.reviewForm = { rating: this.myReviewHere.rating, comment: this.myReviewHere.comment };
                })
                .catch(() => { this.reviews = []; })
                .finally(() => { this.reviewsLoading = false; });
        },
        submitReview() {
            if (!this.reviewForm.rating || this.reviewBusy) 
                return;
            this.reviewBusy = true;
            this.reviewError = '';
            this.reviewSaved = false;
            WonderlyAPI.postReview({ lessonId: this.previewLesson._id, rating: this.reviewForm.rating, comment: this.reviewForm.comment })
                .then(() => {
                    this.reviewSaved = true;
                    this.loadRatings();
                    this.loadMyReviews();
                    return this.loadModalReviews();
                })
                .catch(err => { this.reviewError = err.message; })
                .finally(() => { this.reviewBusy = false; });
        },

        openTeacher(teacherId) {
            this.view = 'teachers';
            this.menuOpen = false;
            this.confirmation = null;
            this.previewLesson = null;
            this.selectedTeacherId = teacherId;
            this.teacherLessons = [];
            window.scrollTo({ top: 0 });
            WonderlyAPI.getLessons({ teacherId: teacherId })
                .then(lessons => { if (this.selectedTeacherId === teacherId) this.teacherLessons = lessons; })
                .catch(err => { this.error = err.message; });
        },
    
        // account
        openAuth(mode) {
            this.authMode = mode;
            this.authError = '';
            if (this.view !== 'auth') 
                this.authReturn = this.view === 'cart' ? 'cart' : null;   
            this.view = 'auth';
            this.menuOpen = false;
            this.previewLesson = null;
            window.scrollTo({ top: 0 });
        },
        submitAuth() {
            if (this.authBusy) return;
            const f = this.authForm;
            this.authError = '';
            if (this.authMode === 'signup') {
                if (!NAME_PATTERN.test(f.name)) { 
                    this.authError = 'Name can only contain letters and spaces.'; 
                    return; 
                }
                if (!EMAIL_PATTERN.test(f.email)) { 
                    this.authError = 'Please enter a valid email address.'; 
                    return; 
                }
                if (f.phone && !PHONE_PATTERN.test(f.phone)) { 
                    this.authError = 'Phone can only contain numbers.'; 
                    return; 
                }
                if (f.password.length < 6) { 
                    this.authError = 'Password must be at least 6 characters.'; 
                    return; 
                }
            } else if (!f.email || !f.password) {
                this.authError = 'Enter your email and password.';
                return;
            }
            this.authBusy = true;
            const request = this.authMode === 'signup'
                ? WonderlyAPI.signup({ role: f.role, name: f.name, email: f.email, phone: f.phone, age: f.age, password: f.password })
                : WonderlyAPI.login({ email: f.email, password: f.password });
            request
                .then(user => {
                    const back = this.authReturn && this.authReturn !== 'auth' ? this.authReturn : 'profile';
                    this.setUser(user);
                    this.authForm = { role: 'parent', name: '', email: '', phone: '', age: '', password: '' };
                    this.showToast((this.authMode === 'signup' ? 'Welcome to Wonderly, ' : 'Welcome back, ') + user.name.split(' ')[0] + '!', 'fa-face-smile');
                    this.go(back);
                })
                .catch(err => { this.authError = err.message; })
                .finally(() => { this.authBusy = false; });
        },
        setUser(user) {
            this.user = user;
            this.profileForm = { name: user.name, phone: user.phone || '', age: user.age || '' };
            if (!this.name) this.name = user.name;
            if (!this.phone) this.phone = user.phone || '';
            return Promise.all([this.loadMyOrders(), this.loadMyReviews()]);
        },
        logout() {
            WonderlyAPI.logout().then(() => {
                this.user = null;
                this.myOrders = [];
                this.myReviews = {};
                this.name = '';
                this.phone = '';
                this.showToast('You are logged out. See you soon!', 'fa-hand');
                this.go('home');
            });
        },
        loadMyOrders() {
            if (!this.user) 
                return Promise.resolve();
            this.historyLoading = true;
            return WonderlyAPI.getMyOrders().then(o => { this.myOrders = o; }).catch(() => {}).finally(() => { this.historyLoading = false; });
        },
        loadMyReviews() {
            return WonderlyAPI.getMyReviews()
                .then(list => { this.myReviews = Object.fromEntries(list.map(r => [r.lessonId, r])); })
                .catch(() => {});
        },
        saveProfile() {
            const f = this.profileForm;
            this.profileMsg = '';
            this.profileError = '';
            if (!NAME_PATTERN.test(f.name)) { 
                this.profileError = 'Name can only contain letters and spaces.'; 
                return; 
            }
            if (f.phone && !PHONE_PATTERN.test(String(f.phone))) { 
                this.profileError = 'Phone can only contain numbers.'; 
                return; 
            }
            this.profileBusy = true;
            WonderlyAPI.updateProfile({ name: f.name, phone: String(f.phone || ''), age: f.age })
                .then(user => { this.user = user; this.profileMsg = 'Profile saved.'; })
                .catch(err => { this.profileError = err.message; })
                .finally(() => { this.profileBusy = false; });
        }
    })
});

app.config.globalProperties.$money = formatPrice;
app.mount('#app');