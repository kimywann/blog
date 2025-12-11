---
title: "로그인 전후에도 끊기지 않는 장바구니 경험 설계"
date: "2025-12-11"
description: "로컬스토리지·서버 장바구니 분리와 병합 로직 구성으로 사용자 흐름을 유지하는 저장 구조 설계 과정"
---

## 1. 설계 배경

커머스 서비스에서는 로그인 여부와 상관없이 장바구니가 그대로 유지돼야 사용자가 끊기지 않고 쇼핑을 이어갈 수 있다고 생각했습니다. 비로그인 상태에서 담은 상품이 로그인 순간 사라지면 다시 찾아 담아야 하고, 이 과정에서 이탈 가능성도 높아집니다.

처음에는 로그인 사용자에게만 장바구니 기능을 제공하는 방식도 고민했지만, 비회원 주문이나 나중의 기능 확장까지 고려하면 비로그인 상태에서도 장바구니를 유지할 수 있어야 했습니다. 그래서 로그인 여부에 따라 저장소를 분리하고, 로그인 시 두 저장소를 자연스럽게 합쳐주는 구조를 설계하게 됐습니다.

<br />

<img src="/images/posts/cart-architecture-login-merge/merge-local-to-server-cart.gif" width="550px" style="display: block; margin: 0 auto;" />

## 2. 장바구니 저장소 분리 전략 (localStorage ↔ Server)

로그인 상태에 따라 장바구니 저장 위치를 다르게 구성하였습니다.

<br />

##### 비로그인 사용자

- 비로그인 사용자는 서버 식별 정보가 없으므로 로컬 스토리지(Redux Persist) 저장

##### 로그인 사용자

- 여러 기기에서 동일한 장바구니를 유지해야 하므로 서버(Supabase DB) 저장

<br />

<img src="/images/posts/cart-architecture-login-merge/1.png" width="550px" style="display: block; margin: 0 auto;" />

<br />

저장 방식이 달라지더라도 UI 코드가 영향을 받지 않도록, 두 저장소를 하나의 인터페이스로 다룰 수 있는 훅을 구현했습니다. 컴포넌트는 장바구니의 저장 위치를 신경 쓰지 않고 동일한 형태로 데이터를 사용할 수 있도록 하였습니다.

## 3. 로그인 시 로컬 → 서버 병합 및 중복 방지

로그인 순간 로컬 장바구니를 서버로 병합하는 과정에서 동일 상품이 서로 다른 저장소에 존재할 경우 중복 레코드가 생성되는 문제가 있었습니다.

이 문제를 해결하기 위해 다음 두 가지를 기반으로 병합 로직을 구성했습니다.

<img src="/images/posts/cart-architecture-login-merge/2.png" width="550px" style="display: block; margin: 0 auto;" />

<br />

#### 1. Supabase UNIQUE 제약조건 적용

user_id, product_id, size 조합을 UNIQUE로 설정하여 동일 상품은 하나의 레코드만 유지되도록 하였습니다. 이를 통해 서버에 이미 존재하는 상품과 로컬에서 가져온 상품이 충돌 없이 병합될 수 있는 기반을 마련하였습니다.

#### 2. Supabase Upsert로 중복 없이 병합

- 이미 서버에 존재하는 상품 → **수량 업데이트(update)**
- 서버에 없는 상품 → **새로 추가(insert)**

<br />
<br />

## 4. 로그인 상태에 따른 저장 방식 분리

장바구니 담기 · 수량 조절 · 삭제 는 유저 상태에 따라 저장 경로를 분기하도록 하였습니다.

#### 비로그인 → 로컬 저장

<img src="/images/posts/cart-architecture-login-merge/3.png" width="550px" style="display: block; margin: 0 auto;" />

#### 로그인 → 서버 저장

<img src="/images/posts/cart-architecture-login-merge/4.png" width="550px" style="display: block; margin: 0 auto;" />

<br />

## 5. 구현 결과

- 로그인 시 로컬 장바구니가 서버 장바구니와 합쳐지도록 설계하여 사용 흐름이 끊기지 않도록 했습니다.
- UNIQUE 제약조건과 Upsert를 적용해 동일한 상품이 여러 번 생성되는 상황을 방지했습니다.

## 6. 러닝 포인트

장바구니는 단순해 보이지만, 실제로는 로그인 전환 흐름까지 고려한 상태 설계가 필요하다는 점을 배웠습니다. 비로그인에서 로그인으로 넘어가도 사용 흐름이 자연스럽게 유지되도록 하기 위해, 내부적으로 다양한 처리 과정을 정리해야 했습니다.

이번 경험 덕분에, 기능을 바로 만들기보다 **사용자가 어떤 흐름으로 움직이는지 먼저 그려보고 구조를 잡는 과정이 훨씬 중요하다는 점**을 다시 생각하게 되었습니다.
