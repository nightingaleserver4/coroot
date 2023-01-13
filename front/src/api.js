import axios from "axios";
import * as storage from "@/utils/storage";
import {v4} from 'uuid';

const baseUrl = '/api/';
const defaultErrorMessage = 'Something went wrong, please try again later.';

export default class Api {
    axios = null;
    router = null;
    vuetify = null;
    deviceId = '';

    constructor(router, vuetify) {
        this.router = router;
        this.vuetify = vuetify.framework;
        this.deviceId = storage.local('device-id');
        if (!this.deviceId) {
            this.deviceId = v4();
            storage.local('device-id', this.deviceId);
        }
        this.axios = axios.create({
            baseURL: baseUrl,
            timeout: 30000,
        })
    }

    appId(id) {
        const parts = id.split(':');
        return {
            ns: parts[0] !== '_' ? parts[0] : '',
            kind: parts[1],
            name: parts[3] ? ':'+parts[3] : parts[2],
        }
    }

    stats(type, data) {
        const event = {
            ...data,
            type,
            device_id: this.deviceId,
            device_size: this.vuetify.breakpoint.name,
        }
        navigator.sendBeacon('/stats', JSON.stringify(event));
    }

    request(req, cb) {
        this.axios(req).then((response) => {
            try {
                cb(response.data, '');
            } catch (e) {
                console.error(e);
            }
        }).catch((error) => {
            const err = error.response && error.response.data && error.response.data.trim() || defaultErrorMessage;
            cb(null, err);
        })
    }

    get(url, cb) {
        this.request({method: 'get', url, params: this.router.currentRoute.query}, cb);
    }

    post(url, data, cb) {
        this.request({method: 'post', url, data}, cb);
    }

    del(url, cb) {
        this.request({method: 'delete', url}, cb);
    }

    getProjects(cb) {
        this.get(`projects`, cb);
    }

    getProject(projectId, cb) {
        this.get(`project/${projectId || ''}`, cb);
    }

    saveProject(projectId, form, cb) {
        this.post(`project/${projectId || ''}`, form, cb);
    }

    delProject(projectId, cb) {
        this.del(`project/${projectId}`, cb);
    }

    projectPath(subPath) {
        const projectId = this.router.currentRoute.params.projectId;
        return `project/${projectId}/${subPath}`;
    }

    getStatus(cb) {
        this.get(this.projectPath(`status`), cb);
    }

    setStatus(form, cb) {
        this.post(this.projectPath(`status`), form, cb);
    }

    getOverview(cb) {
        this.get(this.projectPath(`overview`), cb);
    }

    getCheckConfigs(cb) {
        this.get(this.projectPath(`configs`), cb);
    }

    getApplicationCategories(cb) {
        this.get(this.projectPath(`categories`), cb);
    }

    saveApplicationCategory(form, cb) {
        this.post(this.projectPath(`categories`), form, cb);
    }

    getIntegrations(type, cb) {
        this.get(this.projectPath(`integrations${type ? '/'+type : ''}`), cb);
    }

    saveIntegrations(type, form, cb) {
        if (!form) {
            this.del(this.projectPath(`integrations${type ? '/'+type : ''}`), cb);
            return;
        }
        this.post(this.projectPath(`integrations${type ? '/'+type : ''}`), form, cb);
    }

    getApplication(appId, cb) {
        this.get(this.projectPath(`app/${appId}`), cb);
    }

    getCheckConfig(appId, checkId, cb) {
        this.get(this.projectPath(`app/${appId}/check/${checkId}/config`), cb);
    }

    saveCheckConfig(appId, checkId, form, cb) {
        this.post(this.projectPath(`app/${appId}/check/${checkId}/config`), form, cb);
    }

    getNode(nodeName, cb) {
        this.get(this.projectPath(`node/${nodeName}`), cb);
    }

    search(cb) {
        this.get(this.projectPath(`search`), cb);
    }

    getPromPath() {
        return baseUrl + this.projectPath('prom');
    }
}
