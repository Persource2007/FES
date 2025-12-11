import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  FaUser,
  FaClock,
  FaMapMarkerAlt,
  FaShareAlt,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaWhatsapp,
  FaComment,
  FaMicrophone,
  FaPlay,
  FaPause,
} from 'react-icons/fa'
import apiClient from '../utils/api'
import { API_ENDPOINTS } from '../utils/constants'
import { generateSlug, getStoryIdFromSlug, getStorySlug } from '../utils/slug'
import { formatDate } from '../utils/dateFormat'
import { useError } from '../contexts/ErrorContext'
import Header from '../components/Header'
import Footer from '../components/Footer'
import IndiaMap from '../components/IndiaMap'

function StoryDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { showError, showInfo } = useError()
  const [story, setStory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [comment, setComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [audioRecording, setAudioRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioPlayer, setAudioPlayer] = useState(null)

  useEffect(() => {
    fetchStory()
  }, [slug])

  // Update URL if story slug has changed
  useEffect(() => {
    if (story && story.slug && slug) {
      // If current slug doesn't match story slug, update URL
      if (slug !== story.slug) {
        // Update URL without page reload
        navigate(`/stories/${story.slug}`, { replace: true })
      }
    }
  }, [story, slug, navigate])

  const fetchStory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get story slug (or ID for backward compatibility)
      const storySlug = getStorySlug(slug)
      let response
      
      if (storySlug) {
        // Use slug endpoint
        response = await apiClient.get(API_ENDPOINTS.STORIES.GET_BY_SLUG(storySlug))
      } else {
        // Backward compatibility: use ID endpoint
        const storyId = getStoryIdFromSlug(slug)
        if (!storyId) {
          setError('Invalid story URL')
          setLoading(false)
          return
        }
        response = await apiClient.get(API_ENDPOINTS.STORIES.GET(storyId))
      }
      
      if (response.data.success) {
        setStory(response.data.story)
      } else {
        setError('Story not found')
      }
    } catch (err) {
      console.error('Error fetching story:', err)
      setError(err.response?.data?.message || 'Failed to load story')
    } finally {
      setLoading(false)
    }
  }

  // Generate story URL for sharing
  const getStoryUrl = () => {
    if (!story) return ''
    const storySlug = story.slug || generateSlug(story.title)
    return `${window.location.origin}/stories/${storySlug}`
  }

  // Social sharing functions
  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getStoryUrl())}`
    window.open(url, '_blank', 'width=600,height=400')
  }

  const shareOnTwitter = () => {
    const text = story ? `${story.title} - Commons in India` : ''
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(getStoryUrl())}`
    window.open(url, '_blank', 'width=600,height=400')
  }

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getStoryUrl())}`
    window.open(url, '_blank', 'width=600,height=400')
  }

  const shareOnWhatsApp = () => {
    const text = story ? `${story.title} - ${getStoryUrl()}` : ''
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
      }

      recorder.start()
      setMediaRecorder(recorder)
      setAudioRecording(true)
    } catch (err) {
      console.error('Error starting recording:', err)
      showError('Could not access microphone. Please check permissions.', 'Microphone Access Denied')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      mediaRecorder.stream.getTracks().forEach((track) => track.stop())
      setMediaRecorder(null)
      setAudioRecording(false)
    }
  }

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play()
      setAudioPlayer(audio)
      setIsPlaying(true)

      audio.onended = () => {
        setIsPlaying(false)
        setAudioPlayer(null)
      }
    }
  }

  const stopAudio = () => {
    if (audioPlayer) {
      audioPlayer.pause()
      audioPlayer.currentTime = 0
      setAudioPlayer(null)
      setIsPlaying(false)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!comment.trim() && !audioUrl) {
      return
    }

    try {
      setSubmittingComment(true)
      // TODO: Implement comment submission API
      // For now, just show an info message
      showInfo('Comment submission will be implemented with backend API', 'Coming Soon')
      
      // Reset form
      setComment('')
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
      }
    } catch (err) {
      console.error('Error submitting comment:', err)
      showError('Failed to submit comment', 'Comment Submission Error')
    } finally {
      setSubmittingComment(false)
    }
  }

  // Parse content for embedded media (YouTube, images, etc.)
  const parseContent = (content) => {
    if (!content) return ''

    // Extract YouTube URLs and convert to embeds
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g
    let parsedContent = content.replace(youtubeRegex, (match, videoId) => {
      return `<div class="youtube-embed my-4"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
    })

    // Convert image URLs to img tags
    const imageRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi
    parsedContent = parsedContent.replace(imageRegex, (match) => {
      return `<img src="${match}" alt="Story image" class="max-w-full h-auto rounded-lg my-4" />`
    })

    // Convert line breaks to paragraphs
    parsedContent = parsedContent.split('\n\n').map((paragraph, index) => {
      if (paragraph.trim()) {
        return `<p class="mb-4">${paragraph.trim()}</p>`
      }
      return ''
    }).join('')

    return parsedContent
  }

  // Prepare stories by state for map (only this story's state)
  const storiesByRegion = story && story.state_name
    ? { [story.state_name]: [story] }
    : {}

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
            <p className="text-gray-700">Loading story...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Story Not Found</h1>
            <p className="text-gray-700 mb-6">{error || 'The story you are looking for does not exist.'}</p>
            <Link
              to="/stories"
              className="inline-block bg-green-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-800 transition-colors"
            >
              View All Stories
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Extract story fields (with fallbacks for fields that may not exist yet)
  const storyPhoto = story.photo_url || story.photo || null
  const storyQuote = story.quote || ''
  const facilitatorName = story.facilitator_name || story.facilitator || ''
  const personName = story.person_name || story.author_name || ''
  const personLocation = story.person_location || story.village_name || story.panchayat_name || story.block_name || story.district_name || story.state_name || ''
  const storyDescription = story.content || ''

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Story Page - Matching Image Layout */}
      <section className="py-8 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Right Label - Category Name - Aligned with Header */}
          <div className="flex justify-end mb-6">
            {story.category_name && (
              <span className="bg-green-700 text-white px-4 py-2 text-xs font-bold tracking-wide rounded uppercase">
                {story.category_name}
              </span>
            )}
          </div>

          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-green-800 mb-2 leading-tight">
              {story.title}
            </h1>
            {story.subtitle && (
              <h2 className="text-2xl lg:text-3xl font-bold text-green-800 leading-tight">
                {story.subtitle}
              </h2>
            )}
          </div>

          {/* Main Content Layout: Photo on Left, Quote Below, Description on Right */}
          <div className="flex flex-col lg:flex-row gap-8 mt-8 items-start">
            {/* Left Column: Photo and Quote - Fixed width to match image */}
            <div className="w-full lg:w-auto flex-shrink-0">
              <div className="max-w-xs space-y-6">
                {/* Person Photo */}
                <div className="w-full">
                  {storyPhoto ? (
                    <img
                      src={storyPhoto}
                      alt={personName || 'Story person'}
                      className="w-full h-auto rounded-lg object-cover"
                    />
                  ) : (
                    <img
                      src="/people/people1.png"
                      alt="Default person"
                      className="w-full aspect-[3/4] rounded-lg object-cover"
                    />
                  )}
                </div>

                {/* Quote Section - Only show if quote exists */}
                {storyQuote && (
                  <div className="relative mt-6 w-full">
                    {/* Modern Quote Mark - Above text */}
                    <div className="flex justify-start mb-2">
                      <svg 
                        width="40" 
                        height="40" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-green-700 opacity-30"
                      >
                        <path 
                          d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" 
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                    <p className="text-base lg:text-lg font-semibold text-green-800 leading-relaxed">
                      {storyQuote}
                    </p>
                  </div>
                )}

                {/* Person Attribution - Show independently if person name exists */}
                {personName && (
                  <div className={`mt-6 pt-4 ${storyQuote ? 'border-t border-gray-300' : ''}`}>
                    <p className="font-bold text-gray-900 text-sm lg:text-base tracking-tight">{personName}</p>
                    {personLocation && (
                      <p className="text-xs lg:text-sm text-gray-600 mt-1 font-medium">{personLocation}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Description - Takes remaining space */}
            <div className="flex-1 flex flex-col h-full min-w-0">
              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed flex-1">
                {storyDescription ? (
                  <div
                    className="text-base lg:text-lg leading-7"
                    dangerouslySetInnerHTML={{ __html: parseContent(storyDescription) }}
                  />
                ) : (
                  <p className="text-gray-500 italic text-base">No description available.</p>
                )}
              </div>
            </div>
          </div>

          {/* Facilitator Name at Bottom Right - Only show if facilitator name exists */}
          {facilitatorName && (
            <div className="mt-8 pt-4">
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-base tracking-tight">{facilitatorName}</p>
                  {story.facilitator_organization && (
                    <p className="text-sm text-gray-600 mt-1 font-medium">{story.facilitator_organization}</p>
                  )}
                  <p className="text-xs text-gray-500 uppercase tracking-wide mt-1 font-semibold">Facilitator</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Interactive Map Section - COMMENTED OUT */}
      {/* {story.state_name && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <h2 className="text-3xl font-bold text-green-800 mb-6 text-center">
            Story Location
          </h2>
          <div className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 w-full aspect-square max-w-lg mx-auto overflow-hidden rounded-lg shadow-lg">
            <IndiaMap
              storiesByRegion={storiesByRegion}
              onStateClick={() => {}}
              showFilters={false}
              focusedState={story.state_name}
              interactive={false}
            />
          </div>
        </div>
      )} */}

      {/* Commenting Section */}
      <section className="py-12 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-green-800 mb-6">
            Share Your Thoughts
          </h2>
          <p className="text-gray-600 mb-6">
            Comments are moderated and will be reviewed before being published.
          </p>

          <form onSubmit={handleSubmitComment} className="space-y-4">
            {/* Text Comment */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                <FaComment className="inline mr-2" />
                Text Comment
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-500"
                placeholder="Share your thoughts about this story..."
              />
            </div>

            {/* Audio Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaMicrophone className="inline mr-2" />
                Audio Comment (Optional)
              </label>
              <div className="flex items-center gap-4">
                {!audioRecording && !audioUrl && (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <FaMicrophone />
                    Start Recording
                  </button>
                )}
                {audioRecording && (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    Stop Recording
                  </button>
                )}
                {audioUrl && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={isPlaying ? stopAudio : playAudio}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      {isPlaying ? <FaPause /> : <FaPlay />}
                      {isPlaying ? 'Pause' : 'Play'} Recording
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(audioUrl)
                        setAudioUrl(null)
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingComment || (!comment.trim() && !audioUrl)}
              className="w-full bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submittingComment ? 'Submitting...' : 'Submit Comment'}
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default StoryDetail

