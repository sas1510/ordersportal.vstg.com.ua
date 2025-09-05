import React from "react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans pt-1">
      {/* Hero Section */}
      <section className="relative min-h-[900px] bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/3.jpg')" }}>
        <div className="absolute inset-0 bg-[#003d66]/60 flex items-center justify-center">
          <h1 className="text-white text-4xl md:text-6xl font-bold text-center px-4">
            Вікна Стиль — 18 років на ринку України та Європи
          </h1>
        </div>
      </section>

      {/* Про компанію */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-[#003d66] mb-6">Про компанію</h2>
        <p className="mb-4">
          Наша компанія знаходиться в 5 км від міста Чернівці, в селі Великий Кучурів.
          Площа заводу — понад <strong>16 000 м²</strong>. На виробництві працює понад <strong>500 працівників</strong>.
        </p>
        <p className="mb-4">
          Компанія «Вікна Стиль» успішно працює з 2003 року. Це історія успіху, заснована на бажанні бути кращими,
          без компромісів щодо якості.
        </p>
        <p className="mb-4">
          Ми використовуємо унікальне програмне забезпечення, що дозволяє контролювати всі етапи виробництва
          та відвантаження. Географія продажів охоплює весь захід України, а також Румунію, Німеччину, Італію, Португалію, Канаду, США.
        </p>
      </section>

      {/* Потужності */}
      <section className="bg-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-center">
          <div>
            <h3 className="text-2xl font-semibold text-[#003d66]">Виробнича площа</h3>
            <p className="text-xl mt-2">5500 м²</p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-[#003d66]">ПВХ Вікон</h3>
            <p className="text-xl mt-2">35 000 на місяць</p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-[#003d66]">ПВХ Дверей</h3>
            <p className="text-xl mt-2">9 000 на місяць</p>
          </div>
        </div>
      </section>

      {/* Цінності */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-[#003d66] mb-6">Наші цінності</h2>
        <div className="grid md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-5xl mb-2">🎨</div>
            <p className="font-semibold">Естетика</p>
          </div>
          <div>
            <div className="text-5xl mb-2">✅</div>
            <p className="font-semibold">Якість</p>
          </div>
          <div>
            <div className="text-5xl mb-2">💰</div>
            <p className="font-semibold">Найкраща ціна</p>
          </div>
          <div>
            <div className="text-5xl mb-2">🏠</div>
            <p className="font-semibold">Безпека вашого дому</p>
          </div>
        </div>
      </section>

      {/* Завершення */}
      <section className="bg-[#f0f4f8] py-12 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-[#003d66] mb-4">
            ДВЕРІ, ЯКІ ВІДКРИВАЮТЬ СВІТ УСПІШНОГО ПАРТНЕРСТВА
          </h2>
          <p className="text-gray-700 text-lg">
            “Вікна Стиль” — це не просто бізнес. Це команда, сервіс, стабільність і партнерство.
            Надійність нашої продукції — запорука Вашого комфорту і довіри клієнтів.
          </p>
        </div>
      </section>
    </div>
  );
}
