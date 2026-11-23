const API_BASE_URL = 'http://localhost:3000';
const TOKEN_KEY = 'authToken';

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

// send requests and handle authentications
function request(path, options) {
    const settings = Object.assign({}, options);
    const token = getToken();

    settings.headers = Object.assign(
      {}, 
      token ? { Authorization: 'Bearer ' + token } : {}, 
      settings.headers
    );

    return fetch(API_BASE_URL + path, settings).then(function (response) {
        return response.json().then(function (body) {
            if (!response.ok) {
                throw new Error(body.error || 'Request failed (' + response.status + ')');
            }
            return body;
        });
    });
}

function sendJson(method, path, data) {
    return request(path, { 
        method: method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
    });
}

const WonderlyAPI = {
    getLessons: function (params) {
        const query = new URLSearchParams();

        if (params && params.search) 
            query.set('search', params.search);
        if (params && params.teacherId) 
            query.set('teacherId', params.teacherId);
        
        const text = query.toString();
        return request('/lessons' + (text ? '?' + text : ''));
    },
    getTeachers: function () {
        return request('/teachers');
    },
    getEnrolment: function (lessonId) {
        return request('/enrolment/' + lessonId).then(function (body) { return body.enrolled; });
    },
    updateLessonSpace: function (lessonId, space) {
        return sendJson('PUT', '/lessons/' + lessonId, { space: space });
    },

    // orders
    postOrder: function (order) {
        return sendJson('POST', '/orders', order);
    }
}