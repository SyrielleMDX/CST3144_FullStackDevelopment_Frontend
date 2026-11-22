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
            requestId: 0
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
        }
    })
});

app.config.globalProperties.$money = formatPrice;
app.mount('#app');