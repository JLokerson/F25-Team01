export default function Home() {
  return (
    <main className='relative overflow-hidden' style={{ minHeight: 'calc(100vh - 70px)' }}>
      <img
        src='https://wallpaperaccess.com/full/2723826.jpg'
        alt='truck-bg'
        className='absolute inset-0 w-full h-full object-cover brightness-50'
      />
      <section className='relative z-10 hero text-center py-32'>
        <h2 className='hero-title'>Together, we drive change</h2>
        <p className='hero-sub'>Secure. Scalable. Smart.</p>
        <a href='/migrate/products' className='btn btn--primary btn-hero inline-block'>Get Started</a>
      </section>
    </main>
  )
}
