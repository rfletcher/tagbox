# borrowed from Prototype:
# http://github.com/sstephenson/prototype/tree/master

require 'rake'
require 'rake/clean'
require 'rake/packagetask'

TAGBOX_ROOT          = File.expand_path(File.dirname(__FILE__))
TAGBOX_SRC_DIR       = File.join(TAGBOX_ROOT, 'src')
TAGBOX_DIST_DIR      = File.join(TAGBOX_ROOT, 'dist')
TAGBOX_PKG_DIR       = File.join(TAGBOX_ROOT, 'pkg')
TAGBOX_VERSION       = YAML.load(IO.read(File.join(TAGBOX_SRC_DIR, 'constants.yml')))['TAGBOX_VERSION']

task :default => [:dist, :package, :clean_package_source]

def sprocketize(path, source, destination = source)
  begin
    require "sprockets"
  rescue LoadError => e
    puts "\nYou'll need Sprockets to build Tag Box. Just run:\n\n"
    puts "  $ gem install sprockets"
    puts "\nand you should be all set.\n\n"
  end

  secretary = Sprockets::Secretary.new(
    :root         => File.join(TAGBOX_ROOT, path),
    :load_path    => [TAGBOX_SRC_DIR],
    :source_files => [source]
  )

  mkdir TAGBOX_DIST_DIR, :verbose => false unless File.exists?(TAGBOX_DIST_DIR)
  secretary.concatenation.save_to(File.join(TAGBOX_DIST_DIR, destination))
end

desc 'Builds the distribution.'
task :dist do
  sprocketize('src', 'tagbox.js')
end

CLOBBER.include( TAGBOX_DIST_DIR )

Rake::PackageTask.new('tagbox', TAGBOX_VERSION) do |package|
  package.need_tar_gz = true
  package.package_dir = TAGBOX_PKG_DIR
  package.package_files.include(
    'README*',
    'assets/**',
    'demo/**',
    'dist/tagbox.js'
  )
end

task :clean_package_source do
  rm_rf File.join(TAGBOX_PKG_DIR, "tagbox-#{TAGBOX_VERSION}"), :verbose => false
end

desc 'Builds the distribution and opens the demo in your default browser.'
namespace :reload do
  def reload(browser)
    `open -a "#{browser}" #{TAGBOX_PKG_DIR}/tagbox-#{TAGBOX_VERSION}/demo/index.html`    
  end

  [ :firefox, :webkit, :safari ].each do |browser|
    desc "Rebuild and reload the demo in #{browser}"
    task browser.to_sym => [ :dist, :package ] do
      reload( browser )
    end
  end
end
task :reload => "reload:firefox"

desc 'Push the latest demo to gh-pages'
task :update_demo => :dist do
  require "grancher"

  grancher = Grancher.new do |g|
    g.branch = 'gh-pages'
    g.push_to = 'origin'
    g.message = "Updated demo, v#{TAGBOX_VERSION}"

    # Copy the files needed for the demo
    g.directory 'assets', 'assets'
    g.directory 'demo', 'demo'
    g.directory 'dist', 'dist'
  end

  grancher.commit
  grancher.push
end