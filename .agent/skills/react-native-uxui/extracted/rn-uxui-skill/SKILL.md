---
name: react-native-uxui
description: >
  Guía de diseño UX/UI especializada para apps móviles en React Native. Úsala siempre
  que el usuario pida diseñar, estructurar, prototipar o mejorar pantallas, flujos de
  navegación, componentes visuales o sistemas de diseño en React Native. Aplica también
  cuando el usuario mencione: layout, componentes, navegación, accesibilidad, design tokens,
  Figma-to-RN, dark mode, animaciones, onboarding, formularios, listas, o cualquier aspecto
  visual/interactivo de una app móvil. No esperes que el usuario diga "UX" o "UI"
  explícitamente — si está construyendo pantallas en React Native, este skill es relevante.
---

# React Native UX/UI Design Skill

Guía opinionada y práctica para diseñar interfaces móviles de alta calidad en React Native.
Cubre desde tokens de diseño hasta patrones de interacción, con código listo para usar.

---

## 1. Principios de Diseño Mobile-First

### Reglas de oro
- **Thumb zone**: elementos interactivos en la zona inferior (67% de la pantalla)
- **Tap target mínimo**: 44×44 pt (recomendación Apple/Google)
- **Densidad de información**: máx. 3-4 acciones por pantalla
- **Feedback inmediato**: toda acción debe tener respuesta visual ≤ 100ms
- **Consistencia**: mismos patrones → misma interacción

### Jerarquía visual
```
1. Hero / título principal     → mayor tamaño, alto contraste
2. Subtítulo / descripción     → tamaño medio, color secundario
3. Acciones (CTA)              → botón prominente, color de acción
4. Contenido secundario        → tamaño pequeño, color tenue
5. Metadatos / labels          → caption, color neutro
```

---

## 2. Sistema de Tokens de Diseño

Define tokens antes de escribir componentes. Colócalos en `src/theme/`.

```typescript
// src/theme/tokens.ts
export const tokens = {
  // --- Colores base ---
  colors: {
    primary:   '#6366F1',   // Indigo — acción principal
    secondary: '#8B5CF6',   // Violet — acción secundaria
    success:   '#22C55E',
    warning:   '#F59E0B',
    error:     '#EF4444',
    info:      '#3B82F6',

    // Neutros
    gray50:  '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray400: '#9CA3AF',
    gray600: '#4B5563',
    gray800: '#1F2937',
    gray900: '#111827',

    // Fondos
    bgLight: '#FFFFFF',
    bgDark:  '#0F172A',
  },

  // --- Tipografía ---
  typography: {
    // Tamaños (sp)
    size: { xs: 11, sm: 13, base: 15, lg: 17, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36 },
    // Pesos
    weight: { regular: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800' },
    // Interlineado
    lineHeight: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
    // Familias (ej. Expo Google Fonts)
    family: { sans: 'Inter_400Regular', sansBold: 'Inter_700Bold' },
  },

  // --- Espaciado (múltiplos de 4) ---
  spacing: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 },

  // --- Border radius ---
  radius: { sm: 4, md: 8, lg: 12, xl: 16, '2xl': 24, full: 9999 },

  // --- Sombras ---
  shadow: {
    sm:  { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,  elevation: 2 },
    md:  { shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8,  elevation: 4 },
    lg:  { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  },

  // --- Animaciones ---
  animation: { fast: 150, normal: 300, slow: 500 },
};
```

> **Consejo**: usa `StyleSheet.create` + tokens juntos. Nunca hardcodees colores o
> tamaños directamente en componentes.

---

## 3. Patrones de Navegación

### Stack navigator (pantallas en profundidad)
```typescript
// Usa para: detalle → lista, onboarding, flujos lineales
<Stack.Navigator screenOptions={{ headerShown: false }}>
  <Stack.Screen name="Home"   component={HomeScreen} />
  <Stack.Screen name="Detail" component={DetailScreen} />
</Stack.Navigator>
```

### Bottom Tab Navigator (navegación principal)
```typescript
// Máx. 5 tabs. Siempre con ícono + label
<Tab.Navigator
  screenOptions={({ route }) => ({
    tabBarIcon: ({ focused, color }) => (
      <Icon name={iconMap[route.name]} color={color} size={24} />
    ),
    tabBarActiveTintColor:   tokens.colors.primary,
    tabBarInactiveTintColor: tokens.colors.gray400,
    tabBarStyle: { height: 60, paddingBottom: 8 },
  })}
>
```

### Drawer (menú lateral)
```typescript
// Usa solo si tienes más de 5 secciones principales
// Combínalo con Bottom Tabs para apps complejas
```

### Reglas de navegación
| Patrón | Cuándo usarlo |
|--------|--------------|
| Stack | Flujos lineales, detalles, onboarding |
| Bottom Tabs | 2–5 secciones principales de igual jerarquía |
| Drawer | Apps con muchas secciones o roles diferentes |
| Modal | Acciones contextuales, confirmaciones, filtros |

---

## 4. Componentes Base (snippets listos)

### Botón con estados
```typescript
// components/Button.tsx
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const Button = ({
  label, onPress, variant = 'primary',
  loading = false, disabled = false, fullWidth = false,
}: ButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.75}
    style={[styles.base, styles[variant], fullWidth && styles.full,
            (disabled || loading) && styles.disabled]}
  >
    {loading
      ? <ActivityIndicator color="#fff" size="small" />
      : <Text style={[styles.label, variant === 'ghost' && styles.labelGhost]}>{label}</Text>
    }
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  base:        { height: 52, borderRadius: tokens.radius.lg, alignItems: 'center',
                 justifyContent: 'center', paddingHorizontal: tokens.spacing[6] },
  full:        { width: '100%' },
  primary:     { backgroundColor: tokens.colors.primary },
  secondary:   { backgroundColor: tokens.colors.secondary },
  ghost:       { backgroundColor: 'transparent', borderWidth: 1.5,
                 borderColor: tokens.colors.primary },
  danger:      { backgroundColor: tokens.colors.error },
  disabled:    { opacity: 0.45 },
  label:       { color: '#fff', fontSize: tokens.typography.size.base,
                 fontWeight: tokens.typography.weight.semibold },
  labelGhost:  { color: tokens.colors.primary },
});
```

### Input con validación
```typescript
// components/Input.tsx
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
}

export const Input = ({ label, value, onChangeText, error, ...rest }: InputProps) => (
  <View style={styles.wrapper}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      style={[styles.input, error && styles.inputError]}
      placeholderTextColor={tokens.colors.gray400}
      {...rest}
    />
    {error && <Text style={styles.error}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  wrapper:    { marginBottom: tokens.spacing[4] },
  label:      { fontSize: tokens.typography.size.sm, fontWeight: '500',
                color: tokens.colors.gray600, marginBottom: tokens.spacing[1] },
  input:      { height: 52, borderWidth: 1.5, borderColor: tokens.colors.gray200,
                borderRadius: tokens.radius.md, paddingHorizontal: tokens.spacing[4],
                fontSize: tokens.typography.size.base, color: tokens.colors.gray900,
                backgroundColor: tokens.colors.gray50 },
  inputError: { borderColor: tokens.colors.error },
  error:      { fontSize: tokens.typography.size.xs, color: tokens.colors.error,
                marginTop: tokens.spacing[1] },
});
```

### Card reutilizable
```typescript
// components/Card.tsx
import { View, StyleSheet, ViewStyle } from 'react-native';
import { tokens } from '../theme/tokens';

export const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing[4],
    ...tokens.shadow.md,
  },
});
```

---

## 5. Layouts Frecuentes

### Screen wrapper estándar
```typescript
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';

export const Screen = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaView style={styles.safe}>
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: tokens.colors.bgLight },
  content: { padding: tokens.spacing[4], paddingBottom: tokens.spacing[16] },
});
```

### Lista de alto rendimiento (FlatList)
```typescript
<FlatList
  data={items}
  keyExtractor={item => item.id}
  renderItem={({ item }) => <ItemCard item={item} />}
  ItemSeparatorComponent={() => <View style={{ height: tokens.spacing[3] }} />}
  ListEmptyComponent={<EmptyState />}
  // Performance
  removeClippedSubviews
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

---

## 6. Animaciones UX (Reanimated 2)

```typescript
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, interpolate,
} from 'react-native-reanimated';

// Fade in al montar
const opacity = useSharedValue(0);
useEffect(() => { opacity.value = withTiming(1, { duration: 400 }); }, []);
const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

// Botón con press scale
const scale = useSharedValue(1);
const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
const onPressIn  = () => { scale.value = withSpring(0.95); };
const onPressOut = () => { scale.value = withSpring(1.00); };
```

---

## 7. Dark Mode

```typescript
// src/theme/useTheme.ts
import { useColorScheme } from 'react-native';
import { tokens } from './tokens';

export const useTheme = () => {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  return {
    bg:          dark ? tokens.colors.bgDark    : tokens.colors.bgLight,
    text:        dark ? tokens.colors.gray50    : tokens.colors.gray900,
    textMuted:   dark ? tokens.colors.gray400   : tokens.colors.gray600,
    surface:     dark ? '#1E293B'               : '#FFFFFF',
    border:      dark ? '#334155'               : tokens.colors.gray200,
    isDark: dark,
  };
};
```

---

## 8. Accesibilidad (a11y)

```typescript
// Siempre en elementos interactivos
<TouchableOpacity
  accessible
  accessibilityRole="button"
  accessibilityLabel="Continuar al siguiente paso"
  accessibilityHint="Navega a la pantalla de pago"
>

// Imágenes decorativas
<Image accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />

// Orden de foco
<View accessibilityViewIsModal>   {/* modales */}

// Tamaño dinámico de texto
import { PixelRatio } from 'react-native';
const fontSize = PixelRatio.getFontScale() * tokens.typography.size.base;
```

---

## 9. Patrones de Pantallas Comunes

> Para patrones detallados de cada tipo de pantalla, consulta `references/screens.md`

| Pantalla | Patrón recomendado | Referencia |
|----------|--------------------|------------|
| Onboarding | Pager + dots + CTA sticky | `references/screens.md#onboarding` |
| Login / Registro | KeyboardAvoidingView + validación | `references/screens.md#auth` |
| Home / Feed | FlatList + skeleton loaders | `references/screens.md#feed` |
| Perfil | SectionList + header colapsable | `references/screens.md#profile` |
| Detalle | ScrollView + hero image | `references/screens.md#detail` |
| Formulario multi-paso | Wizard + progress bar | `references/screens.md#form` |
| Búsqueda | SearchBar + resultados + empty state | `references/screens.md#search` |

---

## 10. Checklist de Calidad UX

Antes de dar por lista una pantalla:

- [ ] Tap targets ≥ 44×44 pt
- [ ] Contraste de texto ≥ 4.5:1 (WCAG AA)
- [ ] Estado vacío definido (`EmptyState`)
- [ ] Estado de carga definido (skeleton o spinner)
- [ ] Estado de error definido con acción de retry
- [ ] Funciona en modo oscuro
- [ ] Funciona con Dynamic Type (texto grande)
- [ ] `keyboardShouldPersistTaps="handled"` en scrollables con inputs
- [ ] `accessibilityLabel` en todos los botones e imágenes
- [ ] Sin layout shift al cargar datos

---

## Referencias adicionales

- `references/screens.md` — Patrones detallados por tipo de pantalla
- `references/animations.md` — Recetas de animación con Reanimated
- `references/a11y.md` — Guía completa de accesibilidad móvil
