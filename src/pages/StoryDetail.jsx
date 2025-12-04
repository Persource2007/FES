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
import { generateSlug, getStoryIdFromSlug } from '../utils/slug'
import { formatDate } from '../utils/dateFormat'
import Header from '../components/Header'
import Footer from '../components/Footer'
import IndiaMap from '../components/IndiaMap'

function StoryDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
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

  const fetchStory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Extract story ID from slug
      const storyId = getStoryIdFromSlug(slug)
      if (!storyId) {
        setError('Invalid story URL')
        setLoading(false)
        return
      }

      const response = await apiClient.get(API_ENDPOINTS.STORIES.GET(storyId))
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
    const storySlug = `${story.id}-${generateSlug(story.title)}`
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
      alert('Could not access microphone. Please check permissions.')
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
      // For now, just show an alert
      alert('Comment submission will be implemented with backend API')
      
      // Reset form
      setComment('')
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
      }
    } catch (err) {
      console.error('Error submitting comment:', err)
      alert('Failed to submit comment')
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

  // Prepare stories by region for map (only this story's state)
  const storiesByRegion = story && story.region_name
    ? { [story.region_name]: [story] }
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

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Story Header */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-8 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/stories"
            className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 mb-4 text-sm font-medium"
          >
            ← Back to Stories
          </Link>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
              {story.category_name}
            </span>
            {story.region_name && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                {story.region_name}
              </span>
            )}
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            {story.title}
          </h1>

          <div className="flex items-center gap-6 text-gray-600 mb-6">
            {story.author_name && (
              <div className="flex items-center gap-2">
                <FaUser className="text-gray-400" />
                <span className="font-medium">{story.author_name}</span>
              </div>
            )}
            {story.published_at && (
              <div className="flex items-center gap-2">
                <FaClock className="text-gray-400" />
                <span>{formatDate(story.published_at)}</span>
              </div>
            )}
          </div>

          {/* Social Sharing Buttons */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium">Share:</span>
            <button
              onClick={shareOnFacebook}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              aria-label="Share on Facebook"
            >
              <FaFacebook className="text-sm" />
            </button>
            <button
              onClick={shareOnTwitter}
              className="p-2 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-colors"
              aria-label="Share on Twitter"
            >
              <FaTwitter className="text-sm" />
            </button>
            <button
              onClick={shareOnLinkedIn}
              className="p-2 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-colors"
              aria-label="Share on LinkedIn"
            >
              <FaLinkedin className="text-sm" />
            </button>
            <button
              onClick={shareOnWhatsApp}
              className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
              aria-label="Share on WhatsApp"
            >
              <FaWhatsapp className="text-sm" />
            </button>
          </div>
        </div>
      </section>

      {/* Story Content */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="prose prose-lg max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: parseContent(story.content) }}
          />
        </div>
      </section>

      {/* Interactive Map Section */}
      {story.region_name && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <h2 className="text-3xl font-bold text-green-800 mb-6 text-center">
            Story Location
          </h2>
          <div className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 w-full aspect-square max-w-lg mx-auto overflow-hidden rounded-lg shadow-lg">
            <IndiaMap
              storiesByRegion={storiesByRegion}
              onStateClick={() => {}}
              showFilters={false}
              focusedState={story.region_name}
              interactive={false}
            />
          </div>
        </div>
      )}

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

