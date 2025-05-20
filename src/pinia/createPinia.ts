import {effectScope, markRaw, ref} from 'vue'
import { SymbolPinia } from './rootStore'

export const createPinia = () => {
    const scope = effectScope(true)
    // 创建全局状态 ==> state = ref({})
    const state = scope.run(() => ref({}))

    const pinia: any = markRaw({
        install(app: any) {
            pinia._a  = app
            // 让所有的组件都可以通过inject访问
            app.provide(SymbolPinia, pinia)
            // 兼容vue2
            app.config.globalProperties.$pinia = pinia
        },
        state,
        _a: null, // 保存app
        _e: scope, // 作用域在作用域之下当有数据变化可以触发响应式更新
        _s: new Map() // 记录所有的store
    })
    return pinia
}

