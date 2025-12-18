import { definePlugin } from 'mioki'

export default definePlugin({
  name: 'hi',
  setup() {
    console.log('plugin has been set up!')

    return () => {
      console.log('plugin has been cleaned up!')
    }
  },
})
