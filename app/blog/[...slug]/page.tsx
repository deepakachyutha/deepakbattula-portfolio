import 'css/prism.css'
import 'katex/dist/katex.css'

import { components } from '@/components/MDXComponents'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { sortPosts, coreContent, allCoreContent } from 'pliny/utils/contentlayer'
import { allBlogs, allAuthors } from 'contentlayer/generated'
import type { Authors, Blog } from 'contentlayer/generated'
import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'
import { notFound } from 'next/navigation'
import { slug } from 'github-slugger'
import Link from 'next/link'
import PostSimple from '@/layouts/PostSimple'
import PostLayout from '@/layouts/PostLayout'
import PostBanner from '@/layouts/PostBanner'

const defaultLayout = 'PostLayout'
const layouts = {
  PostSimple,
  PostLayout,
  PostBanner,
}

// Metadata function (can stay as is)
export async function generateMetadata({
  params,
}: {
  params: { slug: string[] }
}): Promise<Metadata | undefined> {
  const slug = decodeURI(params.slug.join('/'))
  const post = allBlogs.find((p) => p.slug === slug)
  const authorList = post?.authors || ['default']
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author)
    return coreContent(authorResults as Authors)
  })
  if (!post) {
    return
  }

  const publishedAt = new Date(post.date).toISOString()
  const modifiedAt = new Date(post.lastmod || post.date).toISOString()
  const authors = authorDetails.map((author) => author.name)
  let imageList = [siteMetadata.socialBanner]
  if (post.images) {
    imageList = typeof post.images === 'string' ? [post.images] : post.images
  }
  const ogImages = imageList.map((img) => {
    return {
      url: img.includes('http') ? img : siteMetadata.siteUrl + img,
    }
  })

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      siteName: siteMetadata.title,
      locale: 'en_US',
      type: 'article',
      publishedTime: publishedAt,
      modifiedTime: modifiedAt,
      url: './',
      images: ogImages,
      authors: authors.length > 0 ? authors : [siteMetadata.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: imageList,
    },
  }
}

export const generateStaticParams = async () => {
  return allBlogs.map((p) => ({ slug: p.slug.split('/').map((name) => decodeURI(name)) }))
}

// Main Page Component
export default async function Page({ params }: { params: { slug: string[] } }) {
  const slugPath = decodeURI(params.slug.join('/'))
  const post = allBlogs.find((p) => p.slug === slugPath) as Blog

  if (!post) {
    return notFound()
  }

  const sortedCoreContents = allCoreContent(sortPosts(allBlogs))
  const postIndex = sortedCoreContents.findIndex((p) => p.slug === slugPath)
  const prev = sortedCoreContents[postIndex + 1]
  const next = sortedCoreContents[postIndex - 1]
  const authorList = post.authors || ['default']
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author)
    return coreContent(authorResults as Authors)
  })
  const mainContent = coreContent(post)
  const jsonLd = post.structuredData
  jsonLd['author'] = authorDetails.map((author) => {
    return {
      '@type': 'Person',
      name: author.name,
    }
  })

  const Layout = layouts[post.layout || defaultLayout]

  // This is the new code that manually counts all the tags
  const tags = {}
  allBlogs.forEach((blogPost) => {
    if (blogPost.tags && blogPost.draft !== true) {
      blogPost.tags.forEach((tag) => {
        const formattedTag = slug(tag)
        if (tags[formattedTag]) {
          tags[formattedTag] += 1
        } else {
          tags[formattedTag] = 1
        }
      })
    }
  })

  return (
    <div className="grid grid-cols-1 gap-y-8 py-8 sm:grid-cols-4 sm:gap-x-12">
      {/* --- SIDEBAR --- */}
      <aside className="hidden sm:col-span-1 sm:block">
        <div className="sticky top-24">
          <h2 className="px-1 text-xs font-bold tracking-wide text-gray-500 uppercase dark:text-gray-400">
            All Tags
          </h2>
          <ul className="mt-4">
            {tags &&
              Object.keys(tags).map((tag) => (
                <li key={tag} className="mb-2">
                  <Link
                    href={`/tags/${slug(tag)}`}
                    className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 px-1 text-sm font-medium"
                    aria-label={`View posts tagged ${tag}`}
                  >
                    {`${tag.charAt(0).toUpperCase() + tag.slice(1).replace('-', ' ')} (${
                      tags[tag]
                    })`}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </aside>

      {/* --- MAIN CONTENT (THE BLOG POST) --- */}
      <main className="sm:col-span-3">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Layout content={mainContent} authorDetails={authorDetails} next={next} prev={prev}>
          <MDXLayoutRenderer code={post.body.code} components={components} toc={post.toc} />
        </Layout>
      </main>
    </div>
  )
}
