import { useThemeStore } from '../stores/themeStore'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Palette, Sun, Moon, Droplets, Sparkles } from 'lucide-react'

const themeIcons = {
  light: Sun,
  dark: Moon,
  blue: Droplets,
  purple: Sparkles
}

export function ThemeSwitcher() {
  const { currentTheme, setTheme, getAvailableThemes } = useThemeStore()
  const themes = getAvailableThemes()
  const currentThemeConfig = themes.find(theme => theme.name === currentTheme)

  const IconComponent = themeIcons[currentTheme]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <IconComponent className="h-4 w-4" />
          <span className="hidden sm:inline">{currentThemeConfig?.displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((theme) => {
          const IconComponent = themeIcons[theme.name as keyof typeof themeIcons]
          return (
            <DropdownMenuItem
              key={theme.name}
              onClick={() => setTheme(theme.name as any)}
              className={`flex items-center gap-2 cursor-pointer ${
                currentTheme === theme.name ? 'bg-accent' : ''
              }`}
            >
              <IconComponent className="h-4 w-4" />
              <span>{theme.displayName}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
