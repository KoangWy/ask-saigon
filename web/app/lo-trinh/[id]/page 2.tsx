import RouteDetail from './RouteDetail';
export default async function RoutePage({ params }: PageProps<'/lo-trinh/[id]'>) { const { id } = await params; return <RouteDetail id={id} />; }
