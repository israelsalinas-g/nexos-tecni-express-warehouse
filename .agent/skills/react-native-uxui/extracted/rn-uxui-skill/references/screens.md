# Patrones de Pantallas — React Native UX/UI

## Tabla de contenidos
- [Onboarding](#onboarding)
- [Auth (Login / Registro)](#auth)
- [Feed / Home](#feed)
- [Perfil](#profile)
- [Detalle](#detail)
- [Formulario multi-paso](#form)
- [Búsqueda](#search)

---

## Onboarding {#onboarding}

**Estructura**: Pager horizontal + indicadores de paso + CTA sticky en footer

```typescript
import PagerView from 'react-native-pager-view';

const slides = [
  { title: 'Bienvenido', subtitle: 'Descripción corta', image: require('./img1.png') },
  { title: 'Función clave', subtitle: 'Descripción corta', image: require('./img2.png') },
  { title: 'Empieza ya',   subtitle: 'Descripción corta', image: require('./img3.png') },
];

export const OnboardingScreen = ({ navigation }) => {
  const [page, setPage] = useState(0);
  const pagerRef = useRef(null);

  return (
    <View style={{ flex: 1 }}>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        onPageSelected={e => setPage(e.nativeEvent.position)}
      >
        {slides.map((s, i) => (
          <View key={i} style={styles.slide}>
            <Image source={s.image} style={styles.hero} />
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.subtitle}>{s.subtitle}</Text>
          </View>
        ))}
      </PagerView>

      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      {/* CTA sticky */}
      <View style={styles.footer}>
        {page < slides.length - 1 ? (
          <Button label="Siguiente" onPress={() => pagerRef.current?.setPage(page + 1)} fullWidth />
        ) : (
          <Button label="Comenzar" onPress={() => navigation.replace('Home')} fullWidth />
        )}
        {page < slides.length - 1 && (
          <TouchableOpacity onPress={() => navigation.replace('Home')}>
            <Text style={styles.skip}>Omitir</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
```

**Reglas de onboarding**:
- Máx. 3–4 slides (más = abandono)
- Imágenes/ilustraciones > texto largo
- El botón "Omitir" siempre visible desde slide 1
- Guardar `onboardingCompleted` en AsyncStorage

---

## Auth (Login / Registro) {#auth}

**Estructura**: KeyboardAvoidingView + ScrollView + inputs + CTA + opción social

```typescript
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

export const LoginScreen = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  const validate = () => {
    const e = {};
    if (!email.includes('@'))    e.email    = 'Email inválido';
    if (password.length < 8)     e.password = 'Mínimo 8 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.login(email, password);
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Inicia sesión</Text>

        <Input label="Email" value={email} onChangeText={setEmail}
               error={errors.email} keyboardType="email-address" autoCapitalize="none" />
        <Input label="Contraseña" value={password} onChangeText={setPassword}
               error={errors.password} secureTextEntry />

        {errors.general && <ErrorBanner message={errors.general} />}

        <Button label="Entrar" onPress={handleSubmit} loading={loading} fullWidth />

        <Divider label="o continúa con" />
        <SocialButton provider="google" />
        <SocialButton provider="apple" />  {/* solo iOS */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
```

---

## Feed / Home {#feed}

**Estructura**: FlatList con skeleton loaders y pull-to-refresh

```typescript
export const FeedScreen = () => {
  const { data, loading, error, refetch } = useFeed();

  if (loading) return <FeedSkeleton />;
  if (error)   return <ErrorState onRetry={refetch} />;

  return (
    <FlatList
      data={data}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <FeedCard item={item} />}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListEmptyComponent={<EmptyState icon="📭" message="No hay contenido aún" />}
      ListHeaderComponent={<FeedHeader />}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refetch}
                        tintColor={tokens.colors.primary} />
      }
      contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      removeClippedSubviews
      maxToRenderPerBatch={8}
    />
  );
};

// Skeleton loader
const FeedSkeleton = () => (
  <View style={{ padding: 16, gap: 12 }}>
    {Array.from({ length: 5 }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </View>
);
```

---

## Perfil {#profile}

**Estructura**: Animated ScrollView con header que se colapsa

```typescript
const HEADER_MAX = 220;
const HEADER_MIN = 70;

export const ProfileScreen = () => {
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, HEADER_MAX - HEADER_MIN],
                        [HEADER_MAX, HEADER_MIN], 'clamp'),
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scrollY.value, [0, HEADER_MAX - HEADER_MIN],
                                     [1, 0.6], 'clamp') }],
  }));

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Animated.Image source={{ uri: user.avatar }} style={[styles.avatar, avatarStyle]} />
        <Text style={styles.name}>{user.name}</Text>
      </Animated.View>

      <Animated.FlatList
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        data={userPosts}
        numColumns={3}
        renderItem={({ item }) => <GridThumb item={item} />}
      />
    </View>
  );
};
```

---

## Detalle {#detail}

**Estructura**: ScrollView con hero image + contenido + CTA sticky al fondo

```typescript
export const DetailScreen = ({ route }) => {
  const { item } = route.params;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Image source={{ uri: item.image }} style={styles.hero}
               resizeMode="cover" />

        {/* Contenido */}
        <View style={styles.body}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>{item.date} · {item.category}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </ScrollView>

      {/* CTA sticky */}
      <View style={styles.cta}>
        <Button label="Confirmar" onPress={handleConfirm} fullWidth />
      </View>
    </View>
  );
};
```

---

## Formulario multi-paso {#form}

**Estructura**: Wizard con estado local + progress bar animada

```typescript
const STEPS = ['Datos básicos', 'Dirección', 'Confirmación'];

export const MultiStepForm = () => {
  const [step, setStep]     = useState(0);
  const [formData, setData] = useState({});
  const progress            = useSharedValue(0);

  const goNext = (stepData) => {
    setData(prev => ({ ...prev, ...stepData }));
    const nextStep = step + 1;
    setStep(nextStep);
    progress.value = withTiming(nextStep / (STEPS.length - 1));
  };

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const stepComponents = [
    <Step1 onNext={goNext} />,
    <Step2 onNext={goNext} onBack={() => setStep(s => s - 1)} />,
    <Step3 data={formData} onSubmit={handleSubmit} />,
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* Progress bar */}
      <View style={styles.track}>
        <Animated.View style={[styles.bar, barStyle]} />
      </View>
      <Text style={styles.stepLabel}>{STEPS[step]}</Text>

      {stepComponents[step]}
    </View>
  );
};
```

---

## Búsqueda {#search}

**Estructura**: SearchBar sticky + FlatList de resultados + empty state

```typescript
export const SearchScreen = () => {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    debounce(async (q) => {
      if (!q.trim()) { setResults([]); return; }
      setLoading(true);
      const r = await searchService.query(q);
      setResults(r);
      setLoading(false);
    }, 350),
    []
  );

  useEffect(() => { search(query); }, [query]);

  return (
    <View style={{ flex: 1 }}>
      {/* SearchBar */}
      <View style={styles.searchBar}>
        <Icon name="search" size={20} color={tokens.colors.gray400} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar..."
          style={styles.searchInput}
          autoFocus
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={tokens.colors.primary} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ResultRow item={item} query={query} />}
          ListEmptyComponent={
            query ? <EmptyState message={`Sin resultados para "${query}"`} /> : null
          }
        />
      )}
    </View>
  );
};
```
