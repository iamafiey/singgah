import { AppProvider, navigate, useApp } from './state'
import { MapView } from './views/MapView'
import { ListView } from './views/ListView'
import { PlacePage } from './views/PlacePage'
import { PlaceEditor } from './views/PlaceEditor'
import { CategoriesView } from './views/CategoriesView'
import { SettingsView } from './views/SettingsView'
import { Toast } from './components/common'
import { IconGrid, IconList, IconMap, IconSettings } from './components/Icons'

function Shell() {
  const { route, t } = useApp()
  const tabs = [
    { name: 'map', label: t('tab.map'), icon: <IconMap /> },
    { name: 'list', label: t('tab.list'), icon: <IconList /> },
    { name: 'categories', label: t('tab.categories'), icon: <IconGrid /> },
    { name: 'settings', label: t('tab.settings'), icon: <IconSettings /> },
  ] as const
  const showTabs = route.name !== 'edit' && route.name !== 'place'

  return (
    <div className={`app ${showTabs ? 'with-tabs' : ''}`}>
      {/* The map stays mounted so it keeps its position and tiles between tabs. */}
      <MapView active={route.name === 'map'} />
      {route.name === 'list' && <ListView />}
      {route.name === 'categories' && <CategoriesView />}
      {route.name === 'settings' && <SettingsView />}
      {route.name === 'place' && <PlacePage key={route.id} id={route.id} />}
      {route.name === 'edit' && <PlaceEditor key={route.id ?? 'new'} id={route.id} />}

      {showTabs && (
        <nav className="tabbar" aria-label="Main">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              className={`tab ${route.name === tab.name ? 'on' : ''}`}
              aria-current={route.name === tab.name ? 'page' : undefined}
              onClick={() => navigate(tab.name === 'map' ? '' : tab.name, true)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      )}
      <Toast />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
