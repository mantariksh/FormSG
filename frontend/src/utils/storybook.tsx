/* eslint-disable react-refresh/only-export-components */
import { useEffect } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Box, BoxProps, Center, useDisclosure } from '@chakra-ui/react'
import { Decorator } from '@storybook/react'
import dayjs from 'dayjs'
import mockdate from 'mockdate'

import { theme } from '~/theme'

import { AuthContext } from '~contexts/AuthContext'
import {
  EMERGENCY_CONTACT_KEY_PREFIX,
  FEATURE_TOUR_KEY_PREFIX,
  ROLLOUT_ANNOUNCEMENT_KEY_PREFIX,
} from '~constants/localStorage'

import { AdminFormLayout } from '~features/admin-form/common/AdminFormLayout'
import { BuilderAndDesignContext } from '~features/admin-form/create/builder-and-design/BuilderAndDesignContext'
import { CreatePageSideBarLayoutProvider } from '~features/admin-form/create/common/CreatePageSideBarLayoutContext'

import { fillHeightCss } from './fillHeightCss'

export const centerDecorator: Decorator = (storyFn) => (
  <Center>{storyFn()}</Center>
)

export const fixedHeightDecorator =
  (height: BoxProps['h']): Decorator =>
  (Story) => (
    <Box h={height}>
      <Story />
    </Box>
  )

export const fullScreenDecorator: Decorator = (storyFn) => (
  <Box w="100vw" css={fillHeightCss}>
    {storyFn()}
  </Box>
)

export const LoggedOutDecorator: Decorator = (storyFn) => {
  return (
    <AuthContext.Provider value={{ isAuthenticated: false }}>
      {storyFn()}
    </AuthContext.Provider>
  )
}

export const LoggedInDecorator: Decorator = (storyFn) => {
  return (
    <AuthContext.Provider value={{ isAuthenticated: true }}>
      {storyFn()}
    </AuthContext.Provider>
  )
}

export const ViewedFeatureTourDecorator: Decorator = (
  storyFn,
  { parameters },
) => {
  const userId = parameters.userId
  const featureTourKey = FEATURE_TOUR_KEY_PREFIX + userId
  window.localStorage.setItem(featureTourKey, JSON.stringify(true))

  useEffect(() => {
    return () => window.localStorage.removeItem(featureTourKey)
  }, [featureTourKey, userId])

  return storyFn()
}

export const ViewedRolloutDecorator: Decorator = (storyFn, { parameters }) => {
  const userId = parameters.userId
  const rolloutKey = ROLLOUT_ANNOUNCEMENT_KEY_PREFIX + userId
  window.localStorage.setItem(rolloutKey, JSON.stringify(true))

  useEffect(() => {
    return () => window.localStorage.removeItem(rolloutKey)
  }, [rolloutKey, userId])

  return storyFn()
}

export const ViewedEmergencyContactDecorator: Decorator = (
  storyFn,
  { parameters },
) => {
  const userId = parameters.userId
  const emergencyContactKey = EMERGENCY_CONTACT_KEY_PREFIX + userId
  window.localStorage.setItem(emergencyContactKey, JSON.stringify(true))

  useEffect(() => {
    return () => window.localStorage.removeItem(emergencyContactKey)
  }, [emergencyContactKey, userId])

  return storyFn()
}

export const EditFieldDrawerDecorator: Decorator = (storyFn) => {
  const deleteFieldModalDisclosure = useDisclosure()
  const deletePaymentModalDisclosure = useDisclosure()
  return (
    <Box maxW="33.25rem">
      <CreatePageSideBarLayoutProvider>
        <BuilderAndDesignContext.Provider
          value={{
            deleteFieldModalDisclosure,
            deletePaymentModalDisclosure,
          }}
        >
          {storyFn()}
        </BuilderAndDesignContext.Provider>
      </CreatePageSideBarLayoutProvider>
    </Box>
  )
}

export const AdminFormCreatePageDecorator: Decorator = (storyFn) => {
  return (
    <MemoryRouter initialEntries={['/12345']}>
      <Routes>
        <Route path={'/:formId'} element={<AdminFormLayout />}>
          <Route index element={storyFn()} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

export const mockDateDecorator: Decorator = (storyFn, { parameters }) => {
  mockdate.reset()

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    return () => mockdate.reset()
  }, [])

  if (parameters.mockdate) {
    mockdate.set(parameters.mockdate)

    const mockedDate = dayjs(parameters.mockdate).format('DD-MM-YYYY HH:mma')

    return (
      <>
        <Box
          pos="fixed"
          top={0}
          right={0}
          bg="white"
          p="0.25rem"
          fontSize="0.75rem"
          lineHeight={1}
          zIndex="docked"
        >
          Mocking date: {mockedDate}
        </Box>
        {storyFn()}
      </>
    )
  }
  return storyFn()
}

interface StoryRouterProps {
  initialEntries: string[]
  path: string
}
/**
 * Decorator to instantiate a story with an initial route.
 */
export const StoryRouter =
  ({ path, initialEntries }: StoryRouterProps): Decorator =>
  (storyFn) => {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path={path} element={storyFn()} />
        </Routes>
      </MemoryRouter>
    )
  }

/**
 * Helper function to convert theme breakpoint into viewport width in px for
 * Chromatic viewpoint snapshots.
 * @param breakpoint the theme breakpoint to convert
 * @returns the number pixel width of the given breakpoint.
 */
const breakpointToViewportWidth = (
  breakpoint: keyof typeof theme.breakpoints,
) => {
  const rem = 16
  return parseInt(theme.breakpoints[breakpoint]) * rem
}

/**
 * Viewports mapping viewport key to their width in (pixel) number.
 * Used for Chromatic viewpoint snapshots which requires the numbers in pixels.
 */
export const viewports = {
  xs: breakpointToViewportWidth('xs'),
  sm: breakpointToViewportWidth('sm'),
  md: breakpointToViewportWidth('md'),
  lg: breakpointToViewportWidth('lg'),
  xl: breakpointToViewportWidth('xl'),
}

export const getMobileViewParameters = () => {
  return {
    viewport: {
      defaultViewport: 'mobile1',
    },
    chromatic: { viewports: [viewports.xs] },
  }
}

export const getTabletViewParameters = () => {
  return {
    viewport: {
      defaultViewport: 'tablet',
    },
    chromatic: { viewports: [viewports.md] },
  }
}
