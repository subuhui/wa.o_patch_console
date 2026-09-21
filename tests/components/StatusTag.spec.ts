import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusTag from '@/components/common/StatusTag.vue'

describe('StatusTag.vue', () => {
  it('renders "已激活" for status "active"', () => {
    const wrapper = mount(StatusTag, {
      props: {
        status: 'active',
      },
    })
    expect(wrapper.text()).toContain('已激活')
  })

  it('renders "已回滚" for status "rolled_back"', () => {
    const wrapper = mount(StatusTag, {
      props: {
        status: 'rolled_back',
      },
    })
    expect(wrapper.text()).toContain('已回滚')
  })

  it('renders "草稿" for status "draft"', () => {
    const wrapper = mount(StatusTag, {
      props: {
        status: 'draft',
      },
    })
    expect(wrapper.text()).toContain('草稿')
  })

  it('renders "未知" when status is undefined', () => {
    const wrapper = mount(StatusTag, {
      props: {
        status: undefined,
      },
    })
    expect(wrapper.text()).toContain('未知')
  })
})
