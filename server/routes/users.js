const express = require('express')
const router = express.Router();
const { User } = require("../models/User")
const { Product } = require("../models/Product")
const { Payment } = require("../models/Payment")
const { auth } = require("../middleware/auth")
const { adminAuth } = require("../middleware/adminAuth")

const async = require('async');

router.post('/register', (req,res) => { // 계정 등록
	const user = new User(req.body)

	user.save((err, userInfo) => {
		if(err) return res.json({success: false, err}) // 에러 발생

		return res.status(200).json({
			success: true
		})
	})
})

router.post('/login', (req, res) => {
	User.findOne({id: req.body.id}, (err, user) => {
		if(!user) {
			return res.json({
				loginSuccess : false,
				message : "해당 아이디가 존재하지 않습니다"
			})
		}

		user.comparePassword(req.body.password, (err, isMatch) => {
			if(!isMatch) {
				return res.json({
					loginSuccess : false,
					meessage : "비밀번호가 일치하지 않습니다"
				})
			}
			
			user.generateToken((err,user) => {
				if(err) return res.status(400).send(err)

				res.cookie("x_auth", user.token)
				.status(200)
				.json({
					loginSuccess: true,
					userId: user.id
				})
			})
		})
	})
})

router.get('/auth', auth, (req, res) => {
	res.setMaxListeners(200).json({
		id : req.user.id,
		isAdmin : req.user.role === 0? false : true,
		isAuth : true,
		email : req.user.email,
		name : req.user.name,
		role : req.user.role,
		cart : req.user.cart,
		history : req.user.history
	})
})

router.get('/admin_auth', adminAuth, (req, res) => {
	res.setMaxListeners(200).json({
		id : req.user.id,
		isAdmin : true,
		isAuth : true,
		email : req.user.email,
		name : req.user.name,
		role : req.user.role,
		cart : req.user.cart,
		history : req.user.history
	})
})



router.get('/logout', auth, (req, res) => {
	User.findOneAndUpdate(
		{id : req.user.id},
		{ token: ""},
		(err, user) => {
			if(err) return res.hostname({
				success: false, err
			});
			return res.status(200).send({
				success: true
			})
		}
	)
})

router.post('/find_id', (req, res) => {
	User.findOne({email: req.body.email, name : req.body.name}, (err, user) => {
	   if(!user.email){
		  return res.json({
			 findId : false,
			 message : "이메일에 해당하는 아이디가 없습니다"
		  })
	   }
	   else if(!user.name){
			 return res.json({
				findId : false,
				message : "이름에 해당하는 아이디가 없습니다"
			 })
		  }
	   return res.status(200).json({
		  findId : true,
		  userId : user.id
	   })
	})
 })

 router.post('/forget_pass', (req, res) => {
	User.findOne({id : req.body.id, email: req.body.email, name: req.body.name}, (err, user) =>{
		if(!user.id){
			return res.json({
				findPass : false,
				message : "계정이 존재하지 않습니다"
			})
		}
		else if(!user.email){
			return res.json({
				findPass : false,
				message : "계정의 이메일이 일치하지 않습니다"
			})
		}
		else if(!user.name){
			return res.json({
				findPass : false,
				message : "계정의 소유자 이름이 일치하지 않습니다"
			})
		}
		else {
			user.password = "1234qwerasdf"
			user.save((err, userInfo) => {
				if(err) return res.json({success: false, err}) // 에러 발생
		
				return res.status(200).json({
					success: true,
					message : "비밀번호가 1234567890으로 초기화"
				})
			})
		}
})
 })

// router.post('/forget_pass', (req, res) => {
// 	User.findOne({id : req.body.id}, (err, user) =>{
// 		if(!user){
// 			return res.json({
// 				findPass : false,
// 				message : "계정이 존재하지 않습니다"
// 			})
// 		}
// 		User.findOne({email : req.body.email}, (err, user) => {
// 			if(!user){
// 				return res.json({
// 					findPass : false,
// 					message : "계정의 이메일이 일치하지 않습니다"
// 				})
// 			}
// 			User.findOne({name : req.body.name}, (err, user) => {
// 				if(!user){
// 					return res.json({
// 						findPass : false,
// 						message : "계정의 소유자 이름이 일치하지 않습니다"
// 					})
// 				}			
// 				user.password = "1234qwerasdf"
// 				user.save((err, userInfo) => {
// 					if(err) return res.json({success: false, err}) // 에러 발생
		
// 					return res.status(200).json({
// 						success: true,
// 						message : "비밀번호가 1234567890으로 초기화"
// 					})
// 				})
// 			})		

// 		})

// 	})
// })

router.post('/change_pass', auth, (req, res) => {
	User.findOne({id : req.user.id}, (err, user) => {
		user.password = req.body.password
		user.save((err, userInfo) => {
			if(err) return res.json({success : false, err})

			return res.status(200).json({
				success : true,
				message : "비밀번호 초기화 완료"
			})
		})
	})
})

router.post('/addToCart', auth, (req, res) => {
	//먼저  User Collection에 해당 유저의 정보를 가져오기 
	User.findOne({ _id: req.user._id },
		(err, userInfo) => {

			// 가져온 정보에서 카트에다 넣으려 하는 상품이 이미 들어 있는지 확인 

			let duplicate = false;
			userInfo.cart.forEach((item) => {
				if (item.id === req.body.productId) {
					duplicate = true;
				}
		})

		//상품이 이미 있을때
		if (duplicate) {
			User.findOneAndUpdate(
				{ _id: req.user._id, "cart.id": req.body.productId },
				{ $inc: { "cart.$.quantity": 1 } },
				{ new: true },
				(err, userInfo) => {
					if (err) return res.status(200).json({ success: false, err })
					res.status(200).send(userInfo.cart)
				}
			)
		}
		//상품이 이미 있지 않을때 
		else {
			User.findOneAndUpdate(
				{ _id: req.user._id },
				{
					$push: {
						cart: {
							id: req.body.productId,
							quantity: 1,
							date: Date.now()
						}
					}
				},
				{ new: true },
				(err, userInfo) => {
					if (err) return res.status(400).json({ success: false, err })
					res.status(200).send(userInfo.cart)
				}
			)
		}
	})
})

router.get('/removeFromCart', auth, (req, res) => {

    //먼저 cart안에 내가 지우려고 한 상품을 지워주기 
    User.findOneAndUpdate(
        { _id: req.user._id },
        {
            "$pull":
                { "cart": { "id": req.query.id } }
        },
        { new: true },
        (err, userInfo) => {
            let cart = userInfo.cart;
            let array = cart.map(item => {
                return item.id
            })

            //product collection에서  현재 남아있는 상품들의 정보를 가져오기 

            Product.find({ _id: { $in: array } })
                .populate('writer')
                .exec((err, productInfo) => {
                    return res.status(200).json({
                        productInfo,
                        cart
                    })
                })
        }
    )
})

router.post('/successBuy', auth, (req, res) => {


    //1. User Collection 안에  History 필드 안에  간단한 결제 정보 넣어주기
    let history = [];
    let transactionData = {};

    req.body.cartDetail.product.forEach((item) => {
        history.push({
            dateOfPurchase: Date.now(),
            name: item.title,
            id: item._id,
            price: item.price,
            quantity: item.quantity,
            paymentId: req.body.paymentData.paymentID
        })
    })

    //2. Payment Collection 안에  자세한 결제 정보들 넣어주기 
    transactionData.user = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email
    }

    transactionData.data = req.body.paymentData
    transactionData.product = history

    //history 정보 저장 
    User.findOneAndUpdate(
        { _id: req.user._id },
        { $push: { history: history }, $set: { cart: [] } },
        { new: true },
        (err, user) => {
            if (err) return res.json({ success: false, err })


            //payment에다가  transactionData정보 저장 
            const payment = new Payment(transactionData)
            payment.save((err, doc) => {
                if (err) return res.json({ success: false, err })


                //3. Product Collection 안에 있는 sold 필드 정보 업데이트 시켜주기 


                //상품 당 몇개의 quantity를 샀는지 

                let products = [];
                doc.product.forEach(item => {
                    products.push({ id: item.id, quantity: item.quantity })
                })


                async.eachSeries(products, (item, callback) => {

                    Product.update(
                        { _id: item.id },
                        {
                            $inc: {
                                "sold": item.quantity
                            }
                        },
                        { new: false },
                        callback
                    )
                }, (err) => {
                    if (err) return res.status(400).json({ success: false, err })
                    res.status(200).json({
                        success: true,
                        cart: user.cart,
                        cartDetail: []
                    })
                }
                )
            })
        }
    )
})

module.exports = router;