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
        }
    }),

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

        // helpers
        teacherName(id) {
            const teacher = this.teachers.find(t => t._id === id);
            return teacher ? teacher.firstName + ' ' + teacher.lastName : '';
        },       
        catId(topic) { 
          return categoryOf(topic); 
        },
        catClass(topic) { 
          return 'cat-' + categoryOf(topic); 
        },
        imageUrl(file) {
            return API_BASE_URL + '/images/' + file;
        },

        // spaces displayed to users
        availableSpaces(lesson) { 
            return Math.max(0, lesson.space - this.cartQty(lesson._id)); 
        },
        hasBought(lessonId) { 
            return this.myOrders.some(o => o.items.some(i => i.lessonId === lessonId)); 
        },
    })
});

app.config.globalProperties.$money = formatPrice;
app.mount('#app');