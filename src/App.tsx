import { AppProvider, navigate, useApp } from './state'
import { HomeView } from './views/HomeView'
import { ListView } from './views/ListView'
import { PlacePage } from './views/PlacePage'
import { PlaceEditor } from './views/PlaceEditor'
import { CategoriesView } from './views/CategoriesView'
import { SettingsView } from './views/SettingsView'
import { Toast } from './components/common'
import { IconFlag, IconGrid, IconMap, IconPlus, IconSettings } from './components/Icons'

function Shell() {
  const { route, t } = useApp()
  const tabs = [
    { name: 'map', path: '', label: t('tab.map'), icon: <IconMap size={20} /> },
    { name: 'list', path: 'list', label: t('tab.list'), icon: <IconFlag size={20} /> },
    { name: 'add', path: 'new', label: t('tab.add'), icon: <IconPlus size={20} /> },
    { name: 'categories', path: 'categories', label: t('tab.categories'), icon: <IconGrid size={20} /> },
    { name: 'settings', path: 'settings', label: t('tab.settings'), icon: <IconSettings size={20} /> },
  ] as const
  const showTabs = route.name !== 'edit' && route.name !== 'place'

  return (
    <div className={`app ${showTabs ? 'with-tabs' : ''}`}>
      {/* The map stays mounted so it keeps its position and tiles between tabs. */}
      <HomeView active={route.name === 'map'} />
      {route.name === 'list' && <ListView />}
      {route.name === 'categories' && <CategoriesView />}
      {route.name === 'settings' && <SettingsView />}
      {route.name === 'place' && <PlacePage key={route.id} id={route.id} />}
      {route.name === 'edit' && <PlaceEditor key={route.id ?? 'new'} id={route.id} />}

      {showTabs && (
        <nav className="tabbar" aria-label={t('tab.nav')}>
          {tabs.map((tab) => (
            <button
              key={tab.name}
              className={`tab ${route.name === tab.name ? 'on' : ''}`}
              aria-current={route.name === tab.name ? 'page' : undefined}
              onClick={() => (tab.name === 'add' ? navigate(tab.path) : navigate(tab.path, true))}
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
