import 'css/prism.css'
import 'katex/dist/katex.css'

import PageTitle from '@/components/PageTitle'
import { components } from '@/components/MDXComponents'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { sortPosts, coreContent, allCoreContent } from 'pliny/utils/contentlayer'
import { allBlogs, allAuthors } from 'contentlayer/generated'
import type { Authors, Blog } from 'contentlayer/generated'
import PostSimple from '@/layouts/PostSimple'
import PostLayout from '@/layouts/PostLayout'
import PostBanner from '@/layouts/PostBanner'
import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'
import { notFound } from 'next/navigation'
import { slug } from 'github-slugger'
import Link from 'next/link'

const defaultLayout = 'PostLayout'
const layouts = {
  PostSimple,
  PostLayout,
  PostBanner,
}

export default async function Page({ params }: { params: { slug: string[] } }) {
  const slugPath = decodeURI(params.slug.join('/'))
  // Filter out drafts in production
  const sortedCoreContents = allCoreContent(sortPosts(allBlogs))
  const postIndex = sortedCoreContents.findIndex((p) => p.slug === slugPath)
  if (postIndex === -1) {
    return notFound()
  }

  const prev = sortedCoreContents[postIndex + 1]
  const next = sortedCoreContents[postIndex - 1]
  const post = allBlogs.find((p) => p.slug === slugPath) as Blog
  const authorList = post?.authors || ['default']
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
  allBlogs.forEach((post) => {
    if (post.tags && post.draft !== true) {
      post.tags.forEach((tag) => {
        const formattedTag = slug(tag) // This correctly uses the imported slug function
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
