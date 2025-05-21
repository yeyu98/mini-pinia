import {getCurrentInstance, inject, effectScope, reactive, toRefs, computed} from 'vue'
import { SymbolPinia } from './rootStore'

const createOptionsStore = (id: any, options: any, pinia: any) => {
    let {state, getters, actions} = options
    let scope;
    
    // 创建当前store
    const store = reactive({})

    const setup = () => {
        pinia.state.value[id] =  state ? state() : {}
        // 获取pinia中的state并响应化
        const localState = toRefs(pinia.state.value[id])
        // 合并actions、getters到 pinia中的state
        // 遍历getters中的属性包一层computed，computed有缓存的作用
        return Object.assign(localState, actions, Object.keys(getters).reduce((computedGetters: any, name: any) => {
            computedGetters[name] = computed(() => getters[name].call(store, store))
        }, {}))
    }


    const setupStore = pinia._e.run(() => {
        scope = effectScope()
        return scope.run(() => setup())
    })
    const wrapAction = (name: any, action: any) => {
        return function() {
            let ret = action.apply(store, arguments)
            return ret
        }
    }
    // 改变action中的this指向
    for(let key in setupStore) {
        const prop = setupStore[key]
        if(typeof prop === 'function') {
            setupStore[key] = wrapAction(key, prop)
        }
    }

    // 合并最新的store
    Object.assign(store, setupStore)
    // 更新store
    pinia._s.set(id, store)

    return store
}

// 支持两种写法
// 第一个参数可能是个id也可能是个配置
// 第二个参数可能是个对象也可能是个setup函数
// TODO：setup暂未实现
export const defineStore = (idOrOptions: any, setup: any) => {
    let id = typeof idOrOptions === 'string' ? idOrOptions : idOrOptions.id
    let options = typeof idOrOptions === 'string' ? setup : idOrOptions

    const useStore = () => {
        const pinia: any = getCurrentInstance() && inject(SymbolPinia)
        if(!pinia._s.has(id)) {
            createOptionsStore(id, options, pinia)
        }
        const store = pinia._s.get(id)

        return store
    }

    return useStore
}