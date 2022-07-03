import {
  h,
  ref,
  PropType,
  defineComponent,
  computed,
  provide,
  CSSProperties,
  withDirectives,
  Transition,
  watchEffect
} from 'vue'
import { VLazyTeleport } from 'vueuc'
import { zindexable } from 'vdirs'
import { useIsMounted } from 'vooks'
import { useTheme, useConfig, useThemeClass } from '../../_mixins'
import type { ThemeProps } from '../../_mixins'
import {
  formatLength,
  call,
  warnOnce,
  useIsComposing,
  eventEffectNotPerformed
} from '../../_utils'
import type { ExtractPublicPropTypes, MaybeArray } from '../../_utils'
import { ScrollbarProps } from '../../_internal'
import { drawerLight, DrawerTheme } from '../styles'
import NDrawerBodyWrapper from './DrawerBodyWrapper'
import type { Placement } from './DrawerBodyWrapper'
import { drawerInjectionKey } from './interface'
import style from './styles/index.cssr'

const drawerProps = {
  ...(useTheme.props as ThemeProps<DrawerTheme>),
  show: Boolean,
  width: {
    type: [Number, String] as PropType<string | number>,
    default: 251
  },
  height: {
    type: [Number, String] as PropType<string | number>,
    default: 251
  },
  placement: {
    type: String as PropType<Placement>,
    default: 'right'
  },
  maskClosable: {
    type: Boolean,
    default: true
  },
  showMask: {
    type: [Boolean, String] as PropType<boolean | 'transparent'>,
    default: true
  },
  to: [String, Object] as PropType<string | HTMLElement>,
  displayDirective: {
    type: String as PropType<'if' | 'show'>,
    default: 'if'
  },
  nativeScrollbar: {
    type: Boolean,
    default: true
  },
  zIndex: Number,
  onMaskClick: Function as PropType<(e: MouseEvent) => void>,
  scrollbarProps: Object as PropType<ScrollbarProps>,
  contentStyle: [Object, String] as PropType<string | CSSProperties>,
  trapFocus: {
    type: Boolean,
    default: true
  },
  onEsc: Function as PropType<() => void>,
  autoFocus: {
    type: Boolean,
    default: true
  },

  closeOnEsc: {
    type: Boolean,
    default: true
  },
  blockScroll: {
    type: Boolean,
    default: true
  },
  adjustable: {
    type: Boolean,
    default: false
  },
  'onUpdate:show': [Function, Array] as PropType<
  MaybeArray<(value: boolean) => void>
  >,
  onUpdateShow: [Function, Array] as PropType<
  MaybeArray<(value: boolean) => void>
  >,
  onAfterEnter: Function as PropType<() => void>,
  onAfterLeave: Function as PropType<() => void>,
  /** @deprecated */
  drawerStyle: [String, Object] as PropType<string | CSSProperties>,
  drawerClass: String,
  target: null,
  onShow: Function as PropType<(value: boolean) => void>,
  onHide: Function as PropType<(value: boolean) => void>
} as const

export type DrawerProps = ExtractPublicPropTypes<typeof drawerProps>

export default defineComponent({
  name: 'Drawer',
  inheritAttrs: false,
  props: drawerProps,
  setup (props) {
    if (__DEV__) {
      watchEffect(() => {
        if (props.drawerStyle !== undefined) {
          warnOnce(
            'drawer',
            '`drawer-style` is deprecated, please use `style` instead.'
          )
        }
        if (props.drawerClass !== undefined) {
          warnOnce(
            'drawer',
            '`drawer-class` is deprecated, please use `class` instead.'
          )
        }
        if (props.target !== undefined) {
          warnOnce('drawer', '`target` is deprecated, please use `to` instead.')
        }
        if (props.onShow !== undefined) {
          warnOnce(
            'drawer',
            '`on-show` is deprecated, please use `on-update:show` instead.'
          )
        }
        if (props.onHide !== undefined) {
          warnOnce(
            'drawer',
            '`on-hide` is deprecated, please use `on-update:show` instead.'
          )
        }
      })
    }
    const { mergedClsPrefixRef, namespaceRef, inlineThemeDisabled } =
      useConfig(props)
    const isMountedRef = useIsMounted()
    const themeRef = useTheme(
      'Drawer',
      '-drawer',
      style,
      drawerLight,
      props,
      mergedClsPrefixRef
    )

    const drawerWidth = ref('')
    const drawerHeight = ref('')

    const styleWidthRef = computed({
      set (val: string) {
        drawerWidth.value = val
      },
      get () {
        const { placement } = props
        if (placement === 'top' || placement === 'bottom') return ''
        const { width } = props
        return drawerWidth.value || formatLength(width)
      }
    })

    const styleHeightRef = computed({
      set (val: string) {
        drawerHeight.value = val
      },
      get () {
        const { placement } = props
        if (placement === 'left' || placement === 'right') return ''
        const { height } = props
        return drawerHeight.value || formatLength(height)
      }
    })

    const mergedBodyStyleRef = computed<Array<CSSProperties | string>>(() => {
      return [
        {
          width: styleWidthRef.value,
          height: styleHeightRef.value
        },
        props.drawerStyle || ''
      ]
    })

    function handleMaskClick (e: MouseEvent): void {
      const { onMaskClick, maskClosable } = props
      if (maskClosable) {
        doUpdateShow(false)
      }
      if (onMaskClick) onMaskClick(e)
    }

    const isComposingRef = useIsComposing()

    function handleEsc (e: KeyboardEvent): void {
      props.onEsc?.()
      if (props.show && props.closeOnEsc && eventEffectNotPerformed(e)) {
        !isComposingRef.value && doUpdateShow(false)
      }
    }
    function doUpdateShow (show: boolean): void {
      const { onHide, onUpdateShow, 'onUpdate:show': _onUpdateShow } = props
      if (onUpdateShow) call(onUpdateShow, show)
      if (_onUpdateShow) call(_onUpdateShow, show)
      // deprecated
      if (onHide && !show) call(onHide, show)
    }
    provide(drawerInjectionKey, {
      isMountedRef: isMountedRef,
      mergedThemeRef: themeRef,
      mergedClsPrefixRef,
      doUpdateShow,
      width: styleWidthRef,
      height: styleHeightRef
    })
    const cssVarsRef = computed(() => {
      const {
        common: { cubicBezierEaseInOut, cubicBezierEaseIn, cubicBezierEaseOut },
        self: {
          color,
          textColor,
          boxShadow,
          lineHeight,
          headerPadding,
          footerPadding,
          bodyPadding,
          titleFontSize,
          titleTextColor,
          titleFontWeight,
          headerBorderBottom,
          footerBorderTop,
          closeIconColor,
          closeIconColorHover,
          closeIconColorPressed,
          closeColorHover,
          closeColorPressed,
          closeIconSize,
          closeSize,
          closeBorderRadius,
          baseLineColor
        }
      } = themeRef.value
      return {
        '--n-line-height': lineHeight,
        '--n-color': color,
        '--n-text-color': textColor,
        '--n-box-shadow': boxShadow,
        '--n-bezier': cubicBezierEaseInOut,
        '--n-bezier-out': cubicBezierEaseOut,
        '--n-bezier-in': cubicBezierEaseIn,
        '--n-header-padding': headerPadding,
        '--n-body-padding': bodyPadding,
        '--n-footer-padding': footerPadding,
        '--n-title-text-color': titleTextColor,
        '--n-title-font-size': titleFontSize,
        '--n-title-font-weight': titleFontWeight,
        '--n-header-border-bottom': headerBorderBottom,
        '--n-footer-border-top': footerBorderTop,
        '--n-close-icon-color': closeIconColor,
        '--n-close-icon-color-hover': closeIconColorHover,
        '--n-close-icon-color-pressed': closeIconColorPressed,
        '--n-close-size': closeSize,
        '--n-close-color-hover': closeColorHover,
        '--n-close-color-pressed': closeColorPressed,
        '--n-close-icon-size': closeIconSize,
        '--n-close-border-radius': closeBorderRadius,
        '--n-base-line-color': baseLineColor
      }
    })
    const themeClassHandle = inlineThemeDisabled
      ? useThemeClass('drawer', undefined, cssVarsRef, props)
      : undefined
    return {
      mergedClsPrefix: mergedClsPrefixRef,
      namespace: namespaceRef,
      mergedBodyStyle: mergedBodyStyleRef,
      handleMaskClick,
      handleEsc,
      mergedTheme: themeRef,
      cssVars: inlineThemeDisabled ? undefined : cssVarsRef,
      themeClass: themeClassHandle?.themeClass,
      onRender: themeClassHandle?.onRender,
      isMounted: isMountedRef
    }
  },
  render () {
    const { mergedClsPrefix } = this
    return (
      <VLazyTeleport to={this.to} show={this.show}>
        {{
          default: () => {
            this.onRender?.()
            return withDirectives(
              <div
                class={[
                  `${mergedClsPrefix}-drawer-container`,
                  this.namespace,
                  this.themeClass
                ]}
                style={this.cssVars as CSSProperties}
                role="none"
              >
                {this.showMask ? (
                  <Transition name="fade-in-transition" appear={this.isMounted}>
                    {{
                      default: () =>
                        this.show ? (
                          <div
                            aria-hidden
                            class={[
                              `${mergedClsPrefix}-drawer-mask`,
                              this.showMask === 'transparent' &&
                                `${mergedClsPrefix}-drawer-mask--invisible`
                            ]}
                            onClick={this.handleMaskClick}
                          />
                        ) : null
                    }}
                  </Transition>
                ) : null}
                <NDrawerBodyWrapper
                  {...this.$attrs}
                  class={[this.drawerClass, this.$attrs.class]}
                  style={[this.mergedBodyStyle, this.$attrs.style]}
                  blockScroll={this.blockScroll}
                  contentStyle={this.contentStyle}
                  placement={this.placement}
                  scrollbarProps={this.scrollbarProps}
                  show={this.show}
                  displayDirective={this.displayDirective}
                  nativeScrollbar={this.nativeScrollbar}
                  onAfterEnter={this.onAfterEnter}
                  onAfterLeave={this.onAfterLeave}
                  trapFocus={this.trapFocus}
                  autoFocus={this.autoFocus}
                  adjustable={this.adjustable}
                  showMask={this.showMask}
                  onEsc={this.handleEsc}
                  onClickoutside={this.handleMaskClick}
                >
                  {this.$slots}
                </NDrawerBodyWrapper>
              </div>,
              [[zindexable, { zIndex: this.zIndex, enabled: this.show }]]
            )
          }
        }}
      </VLazyTeleport>
    )
  }
})
