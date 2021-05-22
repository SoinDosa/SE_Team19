const express = require('express')
const router = express.Router();
const multer = require('multer');
const multerS3 = require('multer-s3');

const { BannerPost } = require("../models/BannerPost")
const { auth } = require("../middleware/auth")
const { adminAuth } = require("../middleware/adminAuth")

require('dotenv').config()
const fs = require('fs')
const S3 = require('aws-sdk/clients/s3')

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY

const s3 = new S3({
	region,
	accessKeyId,
	secretAccessKey
  })
  
  const uploadS3 = multer({
	storage: multerS3({
	  s3: s3,
	  bucket: bucketName,
	  acl: 'public-read',
	  key: function(req, file, cb) {
		cb(null, Date.now().toString()+file.originalname)
	  }
	})
  }).single("file")

router.post('/image', (req, res) =>{
    // 받아온 정보들을 db에 저장
  uploadS3(req, res, (err) => {
    if (err) {
      console.log(err)
      return res.json({ success: false, err })
    }
    return res.json({ success: true, filePath: res.req.file.key, fileName: res.req.file.filename })
  })
})

router.post('/', (req, res) => {
	const bannerPost = new BannerPost(req.body)

	bannerPost.save((err) => {
		if(err) return res.status(400).json({ success: false, err})

		return res.status(200).json({success:true})
	})
})

router.post('/deleteBanner', (req, res) => {
	const bannerPost = new BannerPost
	let bannerPostId = req.query._id

	console.log(req.query._id)
	BannerPost.findOne({_id: bannerPostId})
	.exec((err, bannerPost) => {
		if(err) return res.status(400).json({ success: false, err })
		return res.status(200).json({ success: true, bannerPostId})
	})
})
router.get('/getBanners', (req, res) => {
	let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
	let findArgs = {};
	BannerPost.find(findArgs)
		  .sort([[sortBy, 1]])
		  .exec((err,banners) => {
			if(err) return res.status(400).json({success: false, err})
			res.status(200).json({success:true, banners})
	})
})

module.exports = router;